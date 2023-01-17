from datetime import datetime
import logging
import time
import requests
import re

from bs4 import BeautifulSoup
from urllib.parse import urljoin
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options


logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)

SITE_BASE_URL = "https://online-notary.sunbiz.org"
STATE = "florida"
DATE_KEYS = ('issue_date', 'expiry_date')
NOTARY_DOC_KEY_MAP = {
    "First Name:": "first_name",
    "Address:": "address",
    "Middle Name:": "middle_name",
    "City:": "city",
    "Last Name:": "last_name",
    "State:": "state",
    "Notary ID:": "notary_id",
    "Zip:": "zip_code",
    "Commission:": "commission",
    "Email:": "email",
    "RON Issue Date:": "issue_date",
    "Phone:": "phone",
    "Expire Date:": "expiry_date"
}


def get_token(soup):
    token_tag = soup.find('input',
        attrs={'name': '__RequestVerificationToken', 'type':'hidden'}
    )
    if not token_tag or 'value' not in token_tag.attrs:
        logging.error("Unable to find token_tag")
        return
    token = token_tag['value']
    return token


def get_pagination_meta(soup):
    ul = soup.find('ul', attrs={
        'class': 'pagination mb-0'
    })
    if not ul:
        return -1, -1

    pages_div = ul.find('div', attrs={
        'class': 'page-link text-dark'
    })
    if not pages_div:
        return -1, -1

    pages = pages_div.get_text(strip=True)
    m = re.search(r'Page\s*(\d+)\s*of\s*(\d+)', pages, flags=re.I)
    if not m:
        return -1, -1

    current_page, total_pages = m.groups()
    try:
        return int(current_page), int(total_pages)
    except ValueError as e:
        logging.error(str(e))

    return -1, -1


def get_notaries_links(soup, referer_url):
    trs = soup.find_all('tr', attrs={
        'class': 'clickable',
        'data-target-link': re.compile(r'(\/Notaries\/Details\/\d+)', flags=re.I)
    })
    if not trs:
        return []

    links = [
        (urljoin(SITE_BASE_URL, x['data-target-link']), referer_url)
        for x in trs
    ]
    return links


def extract_notary_details(soup):
    info_tbl = soup.find('table', attrs={'class': 'table table-sm table-bordered mb-0'})
    info = {}
    if info_tbl:
        trs = info_tbl.find_all('tr')
        for tr in trs:
            tds = tr.find_all('td')
            if len(tds) <= 1:
                continue
            for i, td in enumerate(tds):
                if i % 2 != 0:
                    continue

                td_txt = td.get_text(strip=True).strip()
                nxt_td_txt = tds[i+1].get_text(strip=True).strip()
                if not nxt_td_txt:
                    continue

                k = NOTARY_DOC_KEY_MAP.get(td_txt, '')
                if not k:
                    continue

                if k in DATE_KEYS:
                    try:
                        info[k] = datetime.strptime(nxt_td_txt, "%m/%d/%Y")
                    except:
                        pass
                else:
                    info[k] = nxt_td_txt

    service_providers_tbl = soup.find('table', attrs={'id': 'ServiceProviderList'})
    if service_providers_tbl:
        service_providers_lst = []
        trs = service_providers_tbl.find_all('tr')
        for tr in trs[2:]:
            tds = tr.find_all('td')
            if len(tds) < 3:
                continue

            name = tds[0].get_text(strip=True)

            try:
                date_str = tds[1].get_text().replace(" ", "")
                start_date = datetime.strptime(date_str, "%b%d,%Y")
            except:
                start_date = None

            try:
                date_str = tds[2].get_text().replace(" ", "")
                end_date = datetime.strptime(date_str, "%b%d,%Y")
            except:
                end_date = None

            service_providers_lst.append({
                "name": name,
                "start_date": start_date,
                "end_date": end_date
            })

        if service_providers_lst:
            info['service_providers'] = service_providers_lst

    secure_repo_tbl = soup.find('table', attrs={'id': 'SecureRepositoryList'})
    if secure_repo_tbl:
        secure_repo_list = []
        trs = secure_repo_tbl.find_all('tr')
        for tr in trs[2:]:
            tds = tr.find_all('td')
            if len(tds) < 4:
                continue

            name = tds[0].get_text(strip=True)

            try:
                date_str = tds[1].get_text().replace(" ", "")
                start_date = datetime.strptime(date_str, "%b%d,%Y")
            except:
                start_date = None

            try:
                date_str = tds[2].get_text().replace(" ", "")
                end_date = datetime.strptime(date_str, "%b%d,%Y")
            except:
                end_date = None

            pref_contact = tds[3].get_text(strip=True).strip()

            secure_repo_list.append({
                'name': name,
                'start_date': start_date,
                'end_date': end_date,
                'prefered_contact': pref_contact
            })

        if secure_repo_list:
            info['secure_repo'] = secure_repo_list

    return info


def scrape(mongo_collection):
    """
    Scrape https://online-notary.sunbiz.org/ for notary profiles
    @mongo_collection: mongo collection to save notary profiles
    """

    base_headers = {
        'authority': 'online-notary.sunbiz.org',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    }
    cookie_str = ""
    try:
        logging.info(f"url-hit {SITE_BASE_URL}")
        r = requests.get(SITE_BASE_URL, headers=base_headers, timeout=50)
        r.raise_for_status()

        headers = r.headers
        cookie_str = headers.pop("Set-Cookie", "")

    except requests.RequestException as e:
        logging.error(str(e))
        return

    home_page = BeautifulSoup(r.content, 'lxml')
    token = get_token(home_page)
    if not token:
        return

    notaries_url = "https://online-notary.sunbiz.org/?handler=viewall"

    viewall_headers = {
        'authority': 'online-notary.sunbiz.org',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookie_str,
        'origin': 'https://online-notary.sunbiz.org',
        'pragma': 'no-cache',
        'referer': 'https://online-notary.sunbiz.org/',
        'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
    }

    viewall_data = {
        'SearchArg.FirstName': '',
        'SearchArg.LastName': '',
        'SearchArg.CommissionNumber': '',
        'SearchArg.NotaryId': '',
        '__RequestVerificationToken': token,
        'SearchArg.NotaryPublic': '',
        'SearchArg.CivilLawNotary': '',
        'false&SearchArg.CommissionerOfDeeds': False
    }

    for _ in range(3):
        try:
            logging.info(f"url-hit {notaries_url}")
            r = requests.get(url=notaries_url, data=viewall_data, headers=viewall_headers)
            r.raise_for_status()

            soup = BeautifulSoup(r.content, 'lxml')

            token = get_token(soup)
            if not token:
                continue

            cur_pages, ttl_pages = get_pagination_meta(soup)
            if cur_pages < 0:
                continue

            notary_profile_links = get_notaries_links(soup, notaries_url)
            logging.info(f"found {len(notary_profile_links)} links in page {cur_pages}")

            while cur_pages > 0 and cur_pages <= ttl_pages:
                next_page = cur_pages + 1
                page_url = f"https://online-notary.sunbiz.org/?pageNumber={next_page}&handler=viewall"

                viewall_data['__RequestVerificationToken'] = token

                try:
                    logging.info(f"url-hit {page_url}")
                    r = requests.get(url=page_url, data=viewall_data, headers=viewall_headers)
                    r.raise_for_status()
                except requests.RequestException as re1:
                    cur_pages += 1
                    logging.error(str(re1))
                    continue

                page_soup = BeautifulSoup(r.content, 'lxml')
                cur_pages, ttl_pages = get_pagination_meta(page_soup)

                token = get_token(soup)
                cur_notary_profile_links = get_notaries_links(page_soup, page_url)
                if not token or not cur_notary_profile_links:
                    break

                logging.info(f"found {len(cur_notary_profile_links)} links in page {cur_pages}")
                notary_profile_links.extend(cur_notary_profile_links)

            break

        except requests.RequestException as e:
            logging.error(str(e))
            logging.info("Retrying...")

    logging.info(f"total-links {len(notary_profile_links)}")
    if not len(notary_profile_links):
        return []

    # initialize selenium chrome driver to fetch notary details
    # using selenium to fetch notary details as website is using
    # cloudfare to hide sensitive information such as email address
    service = ChromeService(executable_path=ChromeDriverManager().install())
    chrome_options = Options()
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox") # linux only
    chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # Headers to be used in case using requests lib to fetch notary details
    # headers = {
    #     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    #     'accept-encoding': 'gzip, deflate, br',
    #     'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    #     'cache-control': 'no-cache',
    #     'pragma': 'no-cache',
    #     'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
    #     'sec-ch-ua-mobile': '?0',
    #     'sec-ch-ua-platform': '"macOS"',
    #     'sec-fetch-dest': 'document',
    #     'sec-fetch-mode': 'navigate',
    #     'sec-fetch-site': 'same-origin',
    #     'sec-fetch-user': '?1',
    #     'upgrade-insecure-requests': '1',
    #     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    # }

    for link, _ in notary_profile_links:
        try:
            # headers['referer'] = referer
            logging.info(f"url-hit {link}")

            driver.get(link)
            time.sleep(3) # wait for all script to get executed in page

            soup = BeautifulSoup(driver.page_source, 'lxml')
            notary = extract_notary_details(soup)
            if not notary:
                logging.info(f"unable-to-extract notary_profile_link = {link}")
                continue

            notary_id = notary['notary_id']

            existing_notary_doc = mongo_collection.find_one({
                '_state': STATE,
                'notary_id': notary_id,
                'commission': notary['commission']
            })
            if existing_notary_doc is not None:
                notary['updatedAt'] = datetime.utcnow()
                mongo_collection.update_one({"_id": existing_notary_doc['_id']}, {
                    '$set': notary
                })
                logging.info(f"updated notary with id {notary_id}")
            else:
                notary['_state'] = STATE
                notary['createdAt'] = datetime.utcnow()
                notary['updatedAt'] = datetime.utcnow()
                mongo_collection.insert_one(notary)
                logging.info(f"added notary with id {notary_id}")

        except KeyError as e:
            logging.info(str(e))

    driver.quit()
