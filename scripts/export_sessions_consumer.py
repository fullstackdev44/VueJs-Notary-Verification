import boto3
from datetime import datetime, timedelta
import functools
import threading
import requests
import os
import traceback
from bson import ObjectId, json_util as json
from dateutil.parser import parse
import shutil
import json
from pprint import pprint

import pandas as pd
import sib_api_v3_sdk as sib_api
from sib_api_v3_sdk.rest import ApiException
import utils

db_sessionexports = utils.get_mongo_collection('sessionexports')

API_BASE_URL = os.environ['API_BASE_URL']
AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-2')
EXPORT_BUCKET_NAME = 'bluenotarybucket'

sib_configs = sib_api.Configuration()
sib_configs.api_key['api-key'] = os.environ['SENDBLUE_KEY']


AUDIT_TRAIL_ACTION_MAP = {
    "join_session": "Session Joined",
    "kba_answered": "KBA Answered",
    "kba_failed": "KBA Failed",
    "kba_first_set_failed": "KBA First Set Failed",
    "kba_started": "KBA Started",
    "kba_succeeded": "KBA Succeeded",
    "kba_check_stage_aborted": "KBA Aborted",
    "photoid_check_stage_aborted": "PhotoId Aborted",
    "leave_session": "Session Left",
    "session_completed": "Session Completed",
    "session_completed_clicked": "Session Completed Clicked",
    "session_terminated": "Session Terminated",
    "video_capture_started": "Video Capture Started",
    "notary_invited": "Notary Invited Signer For Session",
    "skip_kba_consent_for_customer": "Skip KBA Consent Given by Notary",
    "personal_details_filled": "Personal Details Filled",
    "photo_id_failed": "PhotoId Failed",
    "photo_id_passed": "PhotoId Passed",
    "biometrics_passed": "Biometrics Passed",
    "payment_info_added": "Payment Info Added",
    "vendor_created_session": "Vendor Created Session",
    "open_call_sent": "Open Call Sent",
    "open_call_accepted": "Open Call Accepted",
    "session_document_added": "Session Document Added",
    "witness_invited_to_session": "Witness Invited To Session",
    "witness_open_call_sent": "Witness Open Call Sent",
    "witness_open_call_accepted": "Witness Open Call Accepted",
    "notary_updated_in_session": "Notary Updated In Session"
}

idClassMap = {
    "cct": "Certificate of Citizenship",
    "cid": "Consular ID",
    "dl": "Drivers License",
    "foid": "Colombia Foreigner ID",
    "hic": "Canada Health Insurance Card",
    "id": "Identification Card",
    "ipp": "Russia Internal Passport",
    "keyp": "Australia Keypass ID",
    "ltpass": "Singapore Long Term Visit Pass",
    "myn": "Japan MyNumber Card",
    "nbi": "Philippines National Bureau of Investigation Certificate",
    "nric": "Singapore National Residency ID",
    "ofw": "Philippines Overseas Foreign Worker Card",
    "rp": "Residence Permit",
    "pan": "India Permanent Account Number Card",
    "pid": "Philippines Postal Identification Card",
    "pp": "Passport",
    "ppc": "Passport Card",
    "pr": "Permanent Residence Card",
    "sss": "Philippines Social Security System Card",
    "td": "US Refugee Travel Document",
    "umid": "Philippines United Multi Purpose ID",
    "vid": "Voter Id",
    "visa": "Immigration Visa",
    "wp": "Work Permit"
}

tz_map = {
    "5.5" : "GMT+05:30",
    "-10.0" : "Hawaii",
    "-8.0"  : "Pacific",
    "-7.0"  : "MT",
    "-6.0"  : "CST",
    "-5.0"  : "EST",
    "-4.0"  : "Atlantic",
}

def get_day_suffix(day):
    if day == 1:
        return "st"
    elif day == 2:
        return "nd"
    elif day == 3:
        return "rd"
    else:
        return "th"

def get_session_type_txt(s_type):
    txt = "GNW"
    if s_type == "loan_signing":
        txt = "Loan Signing"
    return txt

def adjust_date_utc(date_str, session_doc):
    tz_offset = -6.0
    if 'meetingTimeZone' in session_doc['session']:
        tz_offset = float(session_doc['session']['meetingTimeZone'])
    tz_offset_str = str(tz_offset)
    if tz_offset_str not in tz_map:
        print(f"UnknownTZ {tz_offset_str}")
        return None, ''
    offset_mins = int(abs(tz_offset)*60)
    tz_offset_str = tz_map[tz_offset_str]
    newdate = None
    try:
        date = parse(date_str)
        if tz_offset < 0:
            newdate = date - timedelta(minutes=offset_mins)
        else:
            newdate = date + timedelta(minutes=offset_mins)
    except:
        pass
    return newdate, tz_offset_str

def adjust_date(date_str, session_doc):
    tz_offset = -6.0
    if 'meetingTimeZone' in session_doc['session']:
        tz_offset = float(session_doc['session']['meetingTimeZone'])
    tz_offset_str = str(tz_offset)
    if tz_offset_str not in tz_map:
        print(f"UnknownTZ {tz_offset_str}")
        return None, ''
    tz_offset_str = tz_map[tz_offset_str]
    offset_mins = int(abs(tz_offset)*60)
    newdate = None
    try:
        date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        if tz_offset < 0:
            newdate = date - timedelta(minutes=offset_mins)
        else:
            newdate = date + timedelta(minutes=offset_mins)
    except:
        pass
    return newdate, tz_offset_str

def get_audit_log_dict(log, session_doc):
    try:
        usertype = ""
        username = ""
        if 'userDoc' in log and 'name' in log['userDoc']:
            username = log['userDoc']['name']
        if 'vendorDoc' in log and 'vendor_name' in log['vendorDoc']:
            usertype = "Vendor"
            username = log['vendorDoc']['vendor_name']
        elif session_doc['session'].get('notaryUserId', '') == log['userId']:
            usertype = "Notary"
        elif session_doc['session'].get('userId', '') == log['userId']:
            usertype = "Primary Signer"
        elif 'isUserWitness' in log and log['isUserWitness']:
            usertype = "Witness"
        elif 'additionalSignerIdentyDocs' in session_doc and session_doc['additionalSignerIdentyDocs']:
            for i, signer in enumerate(session_doc['additionalSignerIdentyDocs'], start=1):
                if signer and 'userId' in signer and signer['userId'] == log['userId']:
                    usertype = f"Additional Signer #{i}"
                    break
            if usertype == "":
                if 'multiSignerList' in session_doc['session'] and session_doc['session']['multiSignerList']:
                    for i, signer in enumerate(session_doc['session']['multiSignerList'], start=1):
                        if signer and 'userDoc' in log and 'email' in signer:
                            if signer['email'] == log['userDoc']['email']:
                                usertype = f"Additional Signer #{i}"
                                break
        if not usertype:
            return {}
        event_time, tz_offset_str = adjust_date_utc(log['createdAt'], session_doc)
        if not event_time:
            return {}
        suffix = get_day_suffix(event_time.day)
        event_log = {
            'Event Name': AUDIT_TRAIL_ACTION_MAP[log['actionType']],
            'User Name': username,
            'User Type': usertype,
            'Event At': event_time.strftime(f'%B, %-d{suffix} %Y at %H:%M%p {tz_offset_str}'),
            'IP': log['ip']
        }
        return event_log
    except KeyError as ke:
        print(f"AuditTrailError: {str(ke)}, sessionId: {str(session_doc['_id'])}")
    return {}

def generate_audit_logs_file(login_session, session_doc, filename):
    try:
        audit_trail_url = f"{API_BASE_URL}/session/getAuditTrail/{session_doc['session']['_id']}"
        ar = login_session.get(audit_trail_url)
        ar.raise_for_status()
        resp = ar.json()
        audit_log = []
        for log in resp.pop('auditTrail', []):
            log = get_audit_log_dict(log, session_doc)
            if log:
                audit_log.append(log)
        df = pd.DataFrame.from_records(audit_log)
        df.to_csv(filename, index=False)
        return True
    except requests.RequestException as e:
        print(f"AuditTrailError: {str(e)}, sessionId: {session_doc['session']['_id']}")
        return False

def is_loan_signing(full_session_doc, user_doc):
    if full_session_doc['session'].get('sessionType', '') != 'loan_signing':
        return False
    if 'loanSigningExtraFields' not in full_session_doc['session']:
        return False
    invitedByCustomer = full_session_doc['session'].get("invitedByCustomer", "")
    if user_doc['role'] == 'customer' and str(invitedByCustomer) != str(user_doc['_id']):
        return False
    return True

def get_kba_type(full_session_doc, identity_data):
    if full_session_doc['session'].get('skipCustomerKBACheck', False):
        return "Skipped"
    if 'typeOfKBA' in full_session_doc['session']:
        if full_session_doc['session']['typeOfKBA'] == 'foreigners_without_residential':
            return "Id + Biometrics"
    kba_type = "ID + KBA"
    idClass = False
    try:
        idClass = (identity_data.personaAPIResponseDoc.fields["identification-class"].value
           if identity_data and identity_data.personaAPIResponseDoc
           and "identification-class" in identity_data.personaAPIResponseDoc.fields
           else (identity_data.fullPersonaAPIResponseDoc.data.attributes.fields["identification-class"].value
                 if identity_data and identity_data.fullPersonaAPIResponseDoc
                 and "identification-class" in identity_data.fullPersonaAPIResponseDoc.data.attributes.fields
                 else None))
    except Exception as e:
        pass
    if idClass and idClass in idClassMap:
        photoIdName = idClassMap[idClass]
        kbaType += f" ({photoIdName})"
    elif 'typeOfPhotoId' in identity_data:
        photo_idname = "Driver's License"
        photo_type = identity_data['typeOfPhotoId']
        if photo_type == 'passportbook':
            photo_idname = "Passport Book"
        elif photo_type == 'passportcard':
            photo_idname = "Passport Card"
        kba_type += f" ({photo_idname})"
    elif 'typeOfPhotoId' in full_session_doc.get('notaries', {}):
        photo_idname = "Driver's License"
        photo_type = full_session_doc['notaries']['typeOfPhotoId']
        if photo_type == 'passportbook':
            photo_idname = "Passport Book"
        elif photo_type == 'passportcard':
            photo_idname = "Passport Card"
        kba_type += f" ({photo_idname})"
    else:
        kba_type += " (Driver's License)"
    return kba_type

def get_session_row(full_session_doc, user_doc, sess_short_id):
    # Session ID
    session_row = {'Session ID': sess_short_id}
    # Notarization Act Type
    act_type = get_session_type_txt(full_session_doc['session'].get('sessionType', None))
    if act_type == "GNW":
        session_row['Notarization Act Type'] = full_session_doc['session'].get('notorizationType', '-')
    else:
        session_row['Notarization Act Type'] = act_type
    if 'loanSessionType' in full_session_doc['session'] and full_session_doc['session']['loanSessionType']:
        session_row['Transaction Type'] = full_session_doc['session']['loanSessionType']
    else:
        session_row['Transaction Type'] = "-"
    if 'otherLoanSessionType' in full_session_doc['session'] and full_session_doc['session']['otherLoanSessionType']:
        session_row['Other Transaction Type'] = full_session_doc['session']['otherLoanSessionType']
    else:
        session_row['Other Transaction Type'] = "-"

    identity_data = {}
    if 'identityData' in full_session_doc:
        identity_data = full_session_doc['identityData']
    elif 'notaries' in full_session_doc:
        identity_data = full_session_doc['notaries']
    identity_data['idcardState'] = '-'
    identity_data['idcardExpiry'] = '-'
    if 'personaAPIResponseDoc' in identity_data and 'fields' in identity_data['personaAPIResponseDoc']:
        fields = identity_data['personaAPIResponseDoc']['fields']
        if 'address-subdivision' in fields:
            identity_data['idcardState'] = fields['address-subdivision'].get('value', '-')
        if 'expiration-date' in fields:
            identity_data['idcardExpiry'] = fields['expiration-date'].get('value', '-')
    if 'fullPersonaAPIResponseDoc' in identity_data:
        included = identity_data['fullPersonaAPIResponseDoc'].get('included', [])
        for identity in included:
            attributes = identity.get('attributes', {})
            status = attributes.get('status', '')
            if status == 'passed' and identity_data['idcardExpiry'] == '-':
                identity_data['idcardExpiry'] = attributes.get('expiration-date', '-')
                break
    if full_session_doc['session'].get('testingAccSession', False) and identity_data['idcardExpiry'] == '-':
        identity_data['idcardExpiry'] = "2027-09-17"

    # Signer Name and Address
    session_row['Signer Name'] = 'N/A'
    if 'firstName' in identity_data and 'lastName' in identity_data:
        session_row['Signer Name'] = f"{identity_data['firstName']} {identity_data['lastName']}"
    session_row['Signer Address'] = 'N/A'
    if 'addressLine1' in identity_data:
        address = "\n".join([
            identity_data['addressLine1'], identity_data.get('userState', ''),
            identity_data.get('userZipCode', ''), identity_data.get('userCountry', '')]
        )
        session_row['Signer Address'] = address
    if is_loan_signing(full_session_doc, user_doc):
        ls_fields = full_session_doc['session']['loanSigningExtraFields']
        session_row['Loan Signing Property Address Line 1'] = ls_fields.get('loan_signing_addressLine1', '-')
        session_row['Loan Signing Property Address Line 2'] = ls_fields.get('loan_signing_addressLine2', '-')
        session_row['Loan Signing Property State'] = ls_fields.get('loan_signing_userState', '-')
        session_row['Property State ZipCode'] = ls_fields.get('loan_signing_userZipCode', '-')
        session_row['Instructions For Notary'] = ls_fields.get('loan_signing_notes_for_notary', '-')
    if 'requestForStateSpecificNotary' in full_session_doc['session']:
        session_row['State Specific Notary Request'] = full_session_doc['session'].get('requestForStateSpecificNotaryStateName','-')
    if 'requestForSpanishNotary' in full_session_doc['session']:
        session_row['Spanish Speaking Notary Requested'] = "Yes"
    if 'sessionStartedTime' in full_session_doc and full_session_doc['sessionStartedTime']:
        start_time, tz_str = adjust_date(full_session_doc['sessionStartedTime'], full_session_doc)
        if start_time:
            suffix = get_day_suffix(start_time.day)
            session_row['Notarization Start Time'] = start_time.strftime(f'%B, %-d{suffix} %Y at %I:%M%p {tz_str}')
    if 'Notarization Start Time' not in session_row:
        session_row['Notarization Start Time'] = 'Notarization not completed yet'

    if 'complete' == full_session_doc.get('status', '') or 'complete' == full_session_doc['session'].get('status', '') or full_session_doc['session'].get('paid', False):
        end_time, tz_str = adjust_date(full_session_doc['sessionEndTime'], full_session_doc)
        if end_time:
            suffix = get_day_suffix(end_time.day)
            session_row['Notarization End Time'] = end_time.strftime(f'%B, %-d{suffix} %Y at %I:%M%p {tz_str}')
    if 'Notarization End Time' not in session_row:
        session_row['Notarization End Time'] = 'Notarization not completed yet'

    # Additional Signers
    additional_signer_txt = ''
    if 'additionalSignerIdentyDocs' in full_session_doc:
        additional_signers = full_session_doc.get('additionalSignerIdentyDocs', [])
        for signer in additional_signers:
            try:
                txt = signer['email']
                nxt_stage = signer.get('additionalSignerNextStage', '')
                if nxt_stage == 'photoid_check_stage':
                    txt += f' - Status: KBA Successful. Photo ID Check Not Completed'
                elif nxt_stage == 'meet_notary':
                    txt += f' - Status: KBA and Photo ID Check Successful'
                else:
                    txt += f' - Status: KBA and Photo ID Check Not Completed'
                additional_signer_txt += f"\n{txt}"
            except:
                pass
    if additional_signer_txt:
        session_row['Additional Signers'] = additional_signer_txt
    else:
        session_row['Additional Signers'] = 'N/A'

    # Type of Credentials Provided
    kba = get_kba_type(full_session_doc, identity_data)
    spc = " "
    if identity_data['idcardState'] != '-':
        kba += f" State: {identity_data['idcardState']} "
        spc = ""
    if identity_data['idcardExpiry'] != '-':
        kba += f"{spc} State: "+identity_data['idcardState']
    session_row['Type of Credentials Provided'] = kba
    session_row['Total Fee Charged'] = 'Notarization not completed yet'
    if 'finalCostOfNotarization' in full_session_doc['session'] and full_session_doc['session']['finalCostOfNotarization']:
        session_row['Total Fee Charged'] = full_session_doc['session']['finalCostOfNotarization']

    session_row['Video Recording'] = 'N/A'
    video_data = full_session_doc.get('videoData', {})
    if video_data and type(video_data) == dict:
        video_url = full_session_doc['videoData'].get('url', '')
        video_name = full_session_doc['videoData'].get('name', '')
        if video_url and video_name:
            session_row['Video Recording'] = f'=HYPERLINK("{video_url}", "{video_name}")'
    else:
        video_status = ""
        if 'videoSavingProcessingStage' in full_session_doc['session']:
            video_status = full_session_doc['session']['videoSavingProcessingStage']
        elif 'videoSavingProcessingError' in full_session_doc['session']:
            video_status = f"Error: {full_session_doc['session']['videoSavingProcessingError']}"
        if video_status:
            session_row['Video Recording'] = video_status

    return session_row

def download_file(url, full_path):
    for _ in range(3):
        if os.path.exists(full_path):
            os.remove(full_path)
        try:
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(full_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=4096):
                        f.write(chunk)
            break
        except requests.RequestException as e:
            print(f"DownloadError err:{str(e)} file: {full_path}")

def download_original_documents(full_session_doc, base_path):
    docs = []
    if 'files' in full_session_doc and full_session_doc['files']:
        docs = full_session_doc['files']
    elif 'documents' in full_session_doc and full_session_doc['documents']:
        docs = full_session_doc['documents']
    elif 'document' in full_session_doc and full_session_doc['document']:
        docs = full_session_doc['document']
    folder = 'Original Documents'
    folder_exists = False
    for doc in docs:
        if not folder_exists:
            if not os.path.exists(os.path.join(base_path, folder)):
                folder = os.path.join(base_path, folder)
                os.makedirs(folder)
                folder_exists = True
            else:
                folder = os.path.join(base_path, folder)
        try:
            url = doc['url']
            full_path = os.path.join(folder, doc['name'])
            download_file(url, full_path)
        except Exception as e:
            print(f"download_original_documents Error: {str(e)}")

def download_session_documents(full_session_doc, base_path, doc_key, folder):
    docs = full_session_doc.get(doc_key, [])
    if not docs or type(docs) != list:
        return
    folder_exists = False
    for doc in docs:
        if not folder_exists:
            if not os.path.exists(os.path.join(base_path, folder)):
                folder = os.path.join(base_path, folder)
                os.makedirs(folder)
                folder_exists = True
            else:
                folder = os.path.join(base_path, folder)
        try:
            url = doc['url']
            full_path = os.path.join(folder, doc['name'])
            download_file(url, full_path)
        except Exception as e:
            print(f"download_session_documents Error: {str(e)}")

def download_video_recording(full_session_doc, base_path):
    if 'videoData' not in full_session_doc:
        return
    video_data = full_session_doc.get('videoData', False)
    if not video_data or type(video_data) != dict:
        return
    if 'name' not in video_data or 'url' not in video_data:
        return
    recording_base_path = os.path.join(base_path, 'Recording')
    if not os.path.exists(recording_base_path):
        os.makedirs(recording_base_path)
    full_video_path = os.path.join(recording_base_path, video_data['name'])
    print('Download video recording: '+full_video_path)
    download_file(video_data['url'], full_video_path)

def send_session_export_mail(exported_file, recipients):
    api_instance = sib_api.TransactionalEmailsApi(sib_api.ApiClient(sib_configs))
    mail_to = []
    for r in recipients:
        mail_to.append(
            sib_api.SendSmtpEmailTo(email=r)
        )
    try:
        api_response = api_instance.send_transac_email(sib_api.SendSmtpEmail(
            to=mail_to,
            template_id=40,
            params={
                'dashboardLink': exported_file['url']
            }
        ))
        print("EmailAPIResp:")
        pprint(str(api_response))
        return True
    except ApiException as e:
        print("Exception when calling TransactionalEmailsApi->send_transac_email: %s\n" % e)
    return False

def do_login(req_session, user_doc):
    login_resp = {}
    try:
        login_url = f"{API_BASE_URL}/auth/login"
        r = req_session.post(login_url, data={
            "email": user_doc['email'],
            "password": user_doc['password'],
            "userType": user_doc['role'],
            "impersonate": "true"
        })
        r.raise_for_status()
        login_resp = r.json()
        req_session.headers['Authorization'] = f"Bearer {login_resp['token']}"
        return login_resp['token']
    except requests.RequestException as e:
        print(f"TokenError: {str(e)}")
    return False

def export_for_notary(export_req_doc):
    exportid = str(export_req_doc['_id'])
    db_sessionexports.update_one({'_id': export_req_doc['_id']}, {
        '$set': {
            'status': 'processing',
            'updatedAt': datetime.utcnow()
        }}
    )
    requested_by = export_req_doc['requestedBy']
    db_users = utils.get_mongo_collection('users')
    user_doc = db_users.find_one(
        filter={'_id': requested_by},
        projection={'email': 1, 'password': 1, 'role': 1}
    )
    login_session = requests.Session()
    print("Loggingin")
    if not do_login(login_session, user_doc):
        print("Login failed")
        return False

    export_audit_logs = export_req_doc['exportItems'].get('audit_logs', False)
    export_documents = export_req_doc['exportItems'].get('documents', False)
    export_archived = export_req_doc['exportItems'].get('export_archived', False)
    tmp_dir = f"/tmp/export_{exportid}"
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    os.chdir(tmp_dir)
    current_page = 1
    total_pages = 100
    retry_count = 0
    sessions_export = pd.DataFrame()
    while current_page <= total_pages and retry_count <= 3:
        sessions_data = []
        try:
            sessions_url = f"{API_BASE_URL}/notary/sessions"
            if export_req_doc['exportView'] == 'notaryDashboard':
                payload = {
                    'notary_user_id': str(requested_by),
                }
            else:
                payload = {
                    'notary_user_id': str(requested_by),
                    'journal': True,
                    'showArchievedSessions': export_archived,
                    'paginate': True,
                    'page': current_page,
                }
            session_resp = login_session.post(sessions_url, json=payload)
            session_resp.raise_for_status()
            sessions_json = session_resp.json()
            if export_req_doc['exportView'] != 'notaryDashboard':
                # notaryDashboard api does not support pagination
                pagination = sessions_json['pagination']
                total_pages = pagination['totalPages']
            sessions_data = sessions_json['sessionData']
        except requests.RequestException as e:
            print(f"SessionRequestError: {str(e)}")
            retry_count += 1
        except KeyError as ke:
            print(f"InvalidSessionResp: {str(ke)}")
            break

        retry_count = 0
        export_items = []
        for session in sessions_data:
            session_mid = session['session']['_id']
            exp_folder_name = session_mid[-5:].upper()
            print(f"Exporting session {exp_folder_name}")
            if not os.path.exists(exp_folder_name):
                os.mkdir(exp_folder_name)
            base_path = os.path.join(tmp_dir, exp_folder_name)
            if export_audit_logs:
                audit_log_csv = os.path.join(tmp_dir, exp_folder_name, 'AuditLogs.csv')
                generate_audit_logs_file(login_session, session, audit_log_csv)
            if export_documents:
                download_original_documents(session, base_path)
                download_session_documents(session, base_path,
                    doc_key='intermediateDocument', folder='Intermediate Documents'
                )
                download_session_documents(session, base_path,
                    doc_key='finalDocument', folder='Final Documents'
                )
                download_session_documents(session, base_path,
                    doc_key='followupDocumentDoc', folder='Session Report'
                )

            download_video_recording(session, base_path)
            session_row = get_session_row(session, user_doc, sess_short_id=exp_folder_name)
            export_items.append(session_row)

        sessions_export = pd.concat([sessions_export, pd.DataFrame(export_items)])
        current_page += 1
        if export_req_doc['exportView'] == 'notaryDashboard':
            break

    if sessions_export.empty:
        print("NoSessionsFound")
        # do not waste mail credit for empty export
        shutil.rmtree(tmp_dir)
        return
    print("Generated Sessions.xlsx")
    excel_fname = "Sessions.xlsx"
    excel_path = os.path.join(tmp_dir, excel_fname)
    sessions_export.to_excel(excel_path, index=False)
    export_zip_fname = f"Bluenotary-Session-Export-{datetime.now().strftime('%d-%m-%y')}"
    archive_name = f"/tmp/{export_zip_fname}"
    try:
        shutil.make_archive(
            archive_name,
            'zip',
            root_dir=tmp_dir
        )
    except Exception as e:
        print(f"ZipCreationFailed {str(e)}")
        return False

    archive_name += '.zip'
    export_zip_fname += '.zip'
    export_file = {}
    try:
        export_key = f"session_exports/notary/{exportid}/{export_zip_fname}"
        s3client = boto3.client('s3',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        print("Uploading ZipFile")
        s3client.put_object(
            Body=open(archive_name, 'rb'),
            Key=export_key,
            Bucket=EXPORT_BUCKET_NAME,
            ContentType='application/zip',
            Expires=datetime.utcnow() + timedelta(days=8)
        )
        url = s3client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': EXPORT_BUCKET_NAME,
                'Key': export_key,
            },
            ExpiresIn=604800 # 60 * 60 * 24 * 7
        )
        print("Uploaded ZipFile")
        export_file['url'] = url
        export_file['key'] = export_key
        export_file['name'] = export_zip_fname
        export_file['bucketname'] = EXPORT_BUCKET_NAME
        export_file['createdAt'] = datetime.utcnow()
    except Exception as e:
        print(f"S3UploadFailed: {str(e)}")
        return False

    try:
        print("Cleaning up")
        os.remove(archive_name)
        shutil.rmtree(tmp_dir)
    except Exception as e:
        print(f"FailedToRemoveDirs: {str(e)}")
    print(f"ExportFinished for:{exportid}")
    print(f"Sending Email to: {','.join(export_req_doc['recipients'])}")
    api_resp = send_session_export_mail(export_file, export_req_doc['recipients'])
    if api_resp:
        db_sessionexports.update_one({'_id': export_req_doc['_id']}, {
            '$set': {
                'status': 'processed',
                'exportfile': export_file,
                'processed_at': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
            }}
        )
        return True
    else:
        return False

def export_for_business(export_req_doc):
    exportid = str(export_req_doc['_id'])
    db_sessionexports.update_one({'_id': export_req_doc['_id']}, {
        '$set': {
            'status': 'processing',
            'updatedAt': datetime.utcnow()
        }}
    )
    requested_by = export_req_doc['requestedBy']
    db_users = utils.get_mongo_collection('users')
    user_doc = db_users.find_one(
        filter={'_id': requested_by},
        projection={'email': 1, 'password': 1, 'role': 1}
    )
    print("Loggingin")
    login_session = requests.Session()
    if not do_login(login_session, user_doc):
        print("LoginFailed")
        return False
    export_audit_logs = export_req_doc['exportItems'].get('audit_logs', False)
    export_documents = export_req_doc['exportItems'].get('documents', False)
    export_archived = export_req_doc['exportItems'].get('export_archived', False)
    tmp_dir = f"/tmp/export_{exportid}"
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    os.chdir(tmp_dir)
    current_page = 1
    total_pages = 100
    retry_count = 0
    sessions_export = pd.DataFrame()
    while current_page <= total_pages and retry_count <= 3:
        sessions_data = []
        try:
            sessions_url = f"{API_BASE_URL}/session/load/sessiondata/{str(current_page)}"
            if export_req_doc['exportView'] == 'businessDocuments':
                payload = {
                    'showArchievedSessions': export_archived,
                }
            else:
                payload = {
                    'businessSessions': True,
                    'showArchievedSessions': export_archived
                }
            session_resp = login_session.post(sessions_url, json=payload)
            session_resp.raise_for_status()
            sessions_json = session_resp.json()
            pagination = sessions_json['paginate']
            total_pages = pagination['totalPages']
            sessions_data = sessions_json['sessionData']
        except requests.RequestException as e:
            print(f"SessionRequestError: {str(e)}")
            retry_count += 1
        except KeyError as ke:
            print(f"InvalidSessionResp: {str(ke)}")
            break
        retry_count = 0
        export_items = []
        for session in sessions_data:
            session_mid = session['session']['_id']
            exp_folder_name = session_mid[-5:].upper()
            print(f"Exporting session {exp_folder_name}")
            if not os.path.exists(exp_folder_name):
                os.mkdir(exp_folder_name)
            base_path = os.path.join(tmp_dir, exp_folder_name)
            if export_audit_logs:
                audit_log_csv = os.path.join(tmp_dir, exp_folder_name, 'AuditLogs.csv')
                generate_audit_logs_file(login_session, session, audit_log_csv)
            if export_documents:
                download_original_documents(session, base_path)
                download_session_documents(session, base_path,
                    doc_key='intermediateDocument', folder='Intermediate Documents'
                )
                download_session_documents(session, base_path,
                    doc_key='finalDocument', folder='Final Documents'
                )
                download_session_documents(session, base_path,
                    doc_key='followupDocumentDoc', folder='Session Report'
                )

            download_video_recording(session, base_path)
            session_row = get_session_row(session, user_doc, sess_short_id=exp_folder_name)
            export_items.append(session_row)

        sessions_export = pd.concat([sessions_export, pd.DataFrame(export_items)])
        current_page += 1

    print("ExportCompleted")
    if sessions_export.empty:
        print("NoSessionsFound")
        # do not waste mail credit for empty export
        shutil.rmtree(tmp_dir)
        return
    excel_fname = "Sessions.xlsx"
    excel_path = os.path.join(tmp_dir, excel_fname)
    sessions_export.to_excel(excel_path, index=False)
    export_zip_fname = f"Bluenotary-Session-Export-{datetime.now().strftime('%d-%m-%y')}"
    archive_name = f"/tmp/{export_zip_fname}"
    try:
        shutil.make_archive(
            archive_name,
            'zip',
            root_dir=tmp_dir
        )
    except Exception as e:
        print(f"ZipCreationFailed {str(e)}")
        return False

    print("ZipCreated")
    archive_name += '.zip'
    export_zip_fname += '.zip'
    export_file = {}
    try:
        export_key = f"session_exports/customer/{exportid}/{export_zip_fname}"
        s3client = boto3.client('s3',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        print("UploadingZipFile")
        s3client.put_object(
            Body=open(archive_name, 'rb'),
            Key=export_key,
            Bucket=EXPORT_BUCKET_NAME,
            ContentType='application/zip',
            Expires=datetime.utcnow() + timedelta(days=8)
        )
        url = s3client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': EXPORT_BUCKET_NAME,
                'Key': export_key,
            },
            ExpiresIn=604800 # 60 * 60 * 24 * 7
        )
        print("UploadedZipFile")
        export_file['url'] = url
        export_file['key'] = export_key
        export_file['name'] = export_zip_fname
        export_file['bucketname'] = EXPORT_BUCKET_NAME
        export_file['createdAt'] = datetime.utcnow()
    except Exception as e:
        print(f"S3UploadFailed: {str(e)}")
        return False

    try:
        print("CleaningUp")
        os.remove(archive_name)
        shutil.rmtree(tmp_dir)
    except Exception as e:
        print(f"FailedToRemoveDirs: {str(e)}")
    print(f"ExportFinished for:{exportid}")
    print(f"Sending Email to: {','.join(export_req_doc['recipients'])}")
    api_resp = send_session_export_mail(export_file, export_req_doc['recipients'])
    if api_resp:
        db_sessionexports.update_one({'_id': export_req_doc['_id']}, {
            '$set': {
                'status': 'processed',
                'exportfile': export_file,
                'processed_at': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
            }}
        )
        return True
    else:
        return False

def do_export(conn, ch, delivery_tag, body):
    thread_id = threading.get_ident()
    print(f"Thread Id: {thread_id} Delivery Tag: {delivery_tag} Body: {str(body)} ")
    try:
        message = json.loads(body)
        export_doc = db_sessionexports.find_one({'_id': ObjectId(message['exportid'])})
        if not export_doc:
            raise Exception(f"Export req doc not found exportid:{message['exportid']}")
        if export_doc['exportView'] in ['notaryDashboard', 'notaryJournal']:
            export_for_notary(export_doc)
        elif export_doc['exportView'] in ['businessDocuments', 'businessSessions']:
            export_for_business(export_doc)
    except Exception as e:
        print(e)
        traceback.print_exc()
    if ch.is_open:
        ch.basic_ack(delivery_tag)

def on_message(ch, method_frm, _header, body, args):
    (conn, thrds) = args
    delivery_tag = method_frm.delivery_tag
    t = threading.Thread(target=do_export, args=(conn, ch, delivery_tag, body))
    t.start()
    thrds.append(t)


threads = []
connection, channel = utils.get_amqp_blocking_conn()
on_message_cb = functools.partial(on_message, args=(connection, threads))
channel.queue_declare('export_sessions', durable=True)
channel.basic_consume('export_sessions', on_message_cb)
try:
    print("Start consuming")
    channel.start_consuming()
except KeyboardInterrupt:
    print("Stop consuming")
    channel.stop_consuming()

for t in threads:
    t.join()

connection.close()