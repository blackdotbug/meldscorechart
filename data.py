import csv
import requests


URL = "https://docs.google.com/spreadsheets/d/1nA16yuLtUrdpZFpPzz-HUm-WlpPW2axHhidMOnC1TTQ/export?format=csv"


def get_data():
    r = requests.get(URL)
    data = r.text
    RESULTS = {'dates': []}
    for line in csv.DictReader(data.splitlines(), skipinitialspace=True):
        RESULTS['dates'].append({
            'date': line['Date'],
            'bilirubin': line['Bilirubin Total (Calculated)0.2 - 1.2 mg/dL'],
            'creatinine': line['Creatinine0.60 - 1.30 mg/dL'],
            'sodium': line['Na135 - 144 mmol/L'],
            'inr': line['INR 0.9 - 1.1']
        })
    return RESULTS