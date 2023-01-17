from datetime import datetime
import logging
import requests
import re
import bs4
import json
from urllib.parse import urljoin

from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)

SITE_BASE_URL = "http://123notary.com"


NOTARY_DOC_KEY_MAP = {
    "123notary.com certified?": "is_onetwothree_certified",
    "# of loan signed:": "no_of_loan_signed",
    "bilingual assistance:": "bilingual_assistance",
    "e-doc capabilities:": "edoc_capabilities",
    "printer:": "have_printer",
    "mb of ram on printer:": "amount_of_ram_inmb",
    "internet:": "internet_connection",
    "wireless card:": "wireless_card",
    "e&o insurance amount:": "eo_insurance_amount",
    "reverse mortgage:": "reverse_mortgage",
    "hospital signings:": "hospital_signings",
    "jail signings:": "jail_signings",
    "name:": "name",
    "mail address:": "address",
    "preferred phone:": "phone",
    "email:": "email",
    "notary service:": "notary_service"
}

def clean_txt(txt):
    txt = re.sub('\xa0', ' ', txt, flags=re.I)
    txt = re.sub('\s{2,}', ' ', txt)
    return txt.strip()


def get_state_links():
    state_list_url = f"{SITE_BASE_URL}/find-a-notary-public.asp"
    try:
        logging.info(f"url-hit {state_list_url}")
        r = requests.get(state_list_url)
        r.raise_for_status()
        soup = bs4.BeautifulSoup(r.content, 'lxml')
    except requests.RequestException as e:
        logging.error(str(e))
        return []

    table = soup.find("table", attrs={"bgcolor": "#D6E3D6"})
    if not table:
        logging.info("failed-to-extract-state-list-table")
        return []

    links = {}
    atags = table.find_all('a', attrs={"class": "Normal_11px_01"})
    for a in atags:
        href = a.get('href', '')
        title = a.get('title', '')
        txt = a.get_text(strip=True)
        if 'notary' in href and title:
            l = f"http://www.123notary.com/notary-result.asp?state={title}"
            links[txt] = l

    return links


def get_notary_links(state_links):
    for state in list(state_links.keys()):
        state_link = state_links.pop(state)
        try:
            logging.info(f"url-hit {state_link}")
            r = requests.get(state_link)
            r.raise_for_status()
            soup = bs4.BeautifulSoup(r.content, 'lxml')
        except requests.RequestException as e:
            logging.error(state_link)
            logging.error(str(e))
            continue

        atags = soup.find_all('a', attrs={"href": re.compile("\/notary-info.asp\?id\=")})
        if not atags:
            logging.info('no-notary-links-found')
            continue

        notary_links = [urljoin(SITE_BASE_URL, x['href']) for x in atags]

        state_links[state] = notary_links
    return state_links


def extract_notary_details(soup):
    info_tbl = soup.find('table', attrs={
        "width": "96%",
        "cellspacing":"0",
        "cellpadding": "0",
        "border": "0",
        "bgcolor": "#D9E6E6",
        "align": "center"
    })

    notary_info = {}
    if not info_tbl:
        return notary_info

    tds = info_tbl.find_all('td', attrs={'class': 'Bold_11px_black'})

    for td in tds:
        key_txt = td.get_text(strip=True)
        if len(key_txt) > 24:
            continue

        key_txt = key_txt.lower()
        if key_txt not in NOTARY_DOC_KEY_MAP:
            continue

        data_text = ''
        key = NOTARY_DOC_KEY_MAP[key_txt]
        if key == "email":
            for sib in td.next_siblings:
                # we are only interested in immediate next td
                if not isinstance(sib, bs4.element.Tag):
                    continue
                if sib.name != 'td':
                    continue
                atag = sib.find('a')
                if not atag:
                    continue
                data_text = atag.get_text(strip=True)
        else:
            for sib in td.next_siblings:
                # we are only interested in immediate next td
                if not isinstance(sib, bs4.element.Tag):
                    continue
                if sib.name != 'td':
                    continue
                data = sib.get_text(strip=True)
                data_text += clean_txt(data)

        if not data_text:
            logging.error(f"failed-to-extract-data k:{key_txt}")
            continue

        notary_info[key] = data_text

    return notary_info


def scrape(mongo_collection):
    """
    Scrape 123notary website for notary profiles
    @mongo_collection: mongo collection to save notary profiles
    """

    state_links = get_state_links()
    if not state_links:
        return

    get_notary_links(state_links)

    service = ChromeService(executable_path=ChromeDriverManager().install())
    chrome_options = Options()
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox") # linux only
    chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(service=service, options=chrome_options)

    logging.info('saving links to tmp file')
    with open('/tmp/123scrapped.json', 'w') as f:
        json.dump(state_links, f)

    for state, notary_links in state_links.items():

        for notary_profile_link in notary_links:

            logging.info(f"url-hit {notary_profile_link}")
            driver.get(notary_profile_link)

            soup = bs4.BeautifulSoup(driver.page_source, 'lxml')

            notary_details = extract_notary_details(soup)
            if 'email' not in notary_details:
                continue

            existing_doc = mongo_collection.find_one({
                'state': state,
                'email': notary_details['email'],
                'source': '123notary'
            })
            if existing_doc:
                notary_details['updatedAt'] = datetime.utcnow()
                mongo_collection.update_one({
                    '_id': existing_doc['_id']
                }, {
                    '$set': notary_details
                })
                logging.info(f"updated notary profile email: {notary_details['email']}")
            else:
                notary_details['state'] = state
                notary_details['_state'] = state.lower()
                notary_details['source'] = '123notary'
                mongo_collection.insert_one(notary_details)
                logging.info(f"saved notary profile email: {notary_details['email']}")
