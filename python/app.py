import asyncio
from pyppeteer import launch
import csv


def writeCsvFile(fname, data, *args, **kwargs):
    """
    @param fname: string, name of file to write
    @param data: list of list of items

    Write data to file
    """

    mycsv = csv.writer(open(fname, 'w', newline=''), *args, **kwargs)
    for row in data:
        mycsv.writerow(row)


async def main():
    browser = await launch()
    page = await browser.newPage()
    await page.goto('https://www.ksestocks.com/BookClosures')
    entry_box_payouts = await page.querySelectorAll(
       'table[id="payo"] > tbody > tr'
   )
    entry_box_without_payouts = await page.querySelectorAll(
       'table[id="wpayo"] > tbody > tr'
   )
    withPayouts = []
    withoutPayouts = []
    for item in entry_box_payouts:
        result = await item.JJeval('th, td', '(nodes => nodes.map(n => n.innerText))')
        withPayouts.append(result)

    for item in entry_box_without_payouts:
        result = await item.JJeval('th, td', '(nodes => nodes.map(n => n.innerText))')
        withoutPayouts.append(result)


    writeCsvFile(r'data-with-payouts.csv', withPayouts)
    writeCsvFile(r'data-without-payouts.csv', withoutPayouts)
    print('CSV files written successfully')
    await browser.close()

asyncio.get_event_loop().run_until_complete(main())

