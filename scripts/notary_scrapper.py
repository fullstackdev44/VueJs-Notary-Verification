import argparse

from scraping import (
    onetowthree_notaries,
    notarycafe,
    sunbiz_florida,
    americannotaryusa,
    asnnotary
)

import utils


def main():
    arg_parser = argparse.ArgumentParser()

    avail_scrappers = [
        "123notaries", "americannotaryusa", "notarycafe", "sunbiz_florida",
        "asnnotary"
    ]
    arg_parser.add_argument('-scrapper',
        help="Scrapper to run",
        type=str, choices=avail_scrappers
    )
    arg_parser.add_argument('-state',
        help="state name to get zip_code in bluenotary database",
        type=str
    )
    arg_parser.add_argument("-z",
        help="Single zip code to search & scrape notaries", type=str,
    )
    arg_parser.add_argument("-zls",
        help="Comma seperated list of zip codes to search & scrape", type=str,
    )
    arg_parser.add_argument("-zf",
        help="Name of the text file to read & search zip codes", type=str,
    )
    args = arg_parser.parse_args()

    scrapper = args.scrapper
    mongo_collection = utils.get_mongo_collection("publicnotaries")

    if scrapper == "123notaries":
        onetowthree_notaries.scrape(mongo_collection)
        return
    elif scrapper == "sunbiz_florida":
        sunbiz_florida.scrape(mongo_collection)
        return

    zip_codes = []

    if args.state:
        state_name = args.state.strip().lower()
        state_collection = utils.get_mongo_collection("usa_states")
        zip_codes_collection = utils.get_mongo_collection("usa_zip_codes")
        state_doc = state_collection.find_one({'name': state_name}, {"_id": 1})
        if state_doc is None:
            print("""Provided state is not available in bluenotary database
            Please import state and zipcodes first""")
            exit(-1)
        zip_codes = zip_codes_collection.distinct("zip_code", {"state_oid": state_doc["_id"]})
    else:
        if args.z:
            zip_codes.append(args.z)
        elif args.zls:
            zip_codes.extend(args.zls.split(','))
        elif args.zf:
            with open(args.zf, 'r') as txtf:
                for l in txtf.readlines():
                    if l.startswith('#'):
                        continue
                    zip_codes.append(l)

    if not zip_codes:
        print(f"Zip codes are required scrapping {state_name}")
        exit(-1)

    zip_codes = list(map(int, zip_codes))
    if scrapper == "americannotaryusa":
        americannotaryusa.scrape(zip_codes, mongo_collection)
    elif scrapper == "notarycafe":
        notarycafe.scrape(zip_codes, mongo_collection)
    elif scrapper == "asnnotary":
        asnnotary.scrape(zip_codes, mongo_collection)


if __name__ == "__main__":
    main()