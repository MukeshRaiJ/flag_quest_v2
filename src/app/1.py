import json
import os

# Dictionary of subregion updates (same as before)
subregion_updates = {
    "Afghanistan": "South Asia",
    "Andorra": "Southern Europe",
    "Angola": "Middle Africa",
    "Argentina": "South America",
    "Armenia": "Western Asia",
    "Australia": "Oceania",
    "Austria": "Western Europe",
    "Azerbaijan": "Western Asia",
    "Bangladesh": "South Asia",
    "Belarus": "Eastern Europe",
    "Belgium": "Western Europe",
    "Belize": "Central America",
    "Bhutan": "South Asia",
    "Bolivia": "South America",
    "Botswana": "Southern Africa",
    "Brazil": "South America",
    "Burundi": "Eastern Africa",
    "Cameroon": "Middle Africa",
    "Canada": "North America",
    "Central African Republic": "Middle Africa",
    "Chad": "Middle Africa",
    "Chile": "South America",
    "China": "Eastern Asia",
    "Colombia": "South America",
    "Comoros": "Eastern Africa",
    "Congo, Democratic Republic of the": "Middle Africa",
    "Congo, Republic of the": "Middle Africa",
    "Costa Rica": "Central America",
    "Cyprus": "Western Asia",
    "Czech Republic": "Eastern Europe",
    "Djibouti": "Eastern Africa",
    "East Timor": "Southeast Asia",
    "Ecuador": "South America",
    "El Salvador": "Central America",
    "Equatorial Guinea": "Middle Africa",
    "Eritrea": "Eastern Africa",
    "Estonia": "Northern Europe",
    "Eswatini": "Southern Africa",
    "Ethiopia": "Eastern Africa",
    "France": "Western Europe",
    "Gabon": "Middle Africa",
    "Germany": "Western Europe",
    "Greece": "Southern Europe",
    "Guatemala": "Central America",
    "Guyana": "South America",
    "Honduras": "Central America",
    "Hungary": "Eastern Europe",
    "India": "South Asia",
    "Ireland": "Northern Europe",
    "Italy": "Southern Europe",
    "Japan": "Eastern Asia",
    "Kenya": "Eastern Africa",
    "Latvia": "Northern Europe",
    "Lesotho": "Southern Africa",
    "Liechtenstein": "Western Europe",
    "Lithuania": "Northern Europe",
    "Luxembourg": "Western Europe",
    "Madagascar": "Eastern Africa",
    "Malawi": "Eastern Africa",
    "Maldives": "South Asia",
    "Malta": "Southern Europe",
    "Marshall Islands": "Micronesia",
    "Mauritius": "Eastern Africa",
    "Mexico": "North America",
    "Moldova": "Eastern Europe",
    "Monaco": "Western Europe",
    "Mongolia": "Eastern Asia",
    "Mozambique": "Eastern Africa",
    "Namibia": "Southern Africa",
    "Nepal": "South Asia",
    "Netherlands": "Western Europe",
    "New Zealand": "Oceania",
    "Nicaragua": "Central America",
    "Palestine": "Western Asia",
    "Panama": "Central America",
    "Paraguay": "South America",
    "Peru": "South America",
    "Poland": "Eastern Europe",
    "Portugal": "Southern Europe",
    "Romania": "Eastern Europe",
    "Russia": "Eastern Europe",
    "Rwanda": "Eastern Africa",
    "San Marino": "Southern Europe",
    "Sao Tome and Principe": "Middle Africa",
    "Slovakia": "Eastern Europe",
    "Somalia": "Eastern Africa",
    "South Africa": "Southern Africa",
    "South Sudan": "Eastern Africa",
    "Spain": "Southern Europe",
    "Sri Lanka": "South Asia",
    "Sudan": "Northern Africa",
    "Suriname": "South America",
    "Switzerland": "Western Europe",
    "Taiwan": "Eastern Asia",
    "Tanzania": "Eastern Africa",
    "Uganda": "Eastern Africa",
    "Ukraine": "Eastern Europe",
    "United Kingdom": "Northern Europe",
    "United States": "North America",
    "Uruguay": "South America",
    "Venezuela": "South America",
    "Zambia": "Eastern Africa",
    "Zimbabwe": "Eastern Africa"
}

def update_country_subregions(input_file):
    # Read the input JSON file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            countries = json.load(f)
        
        # Counter for tracking updates
        updates_made = 0
        
        # Update subregions
        for country in countries:
            if country['name'] in subregion_updates and country['subregion'] == "Other":
                country['subregion'] = subregion_updates[country['name']]
                updates_made += 1
                print(f"Updated {country['name']}: Other -> {subregion_updates[country['name']]}")
        
        # Create backup of original file
        backup_file = input_file + '.backup'
        os.rename(input_file, backup_file)
        print(f"\nCreated backup of original file at: {backup_file}")
        
        # Write the updated data back to the original file
        with open(input_file, 'w', encoding='utf-8') as f:
            json.dump(countries, f, indent=2, ensure_ascii=False)
        
        print(f"\nSuccessfully updated {updates_made} country subregions")
        print(f"Updated data has been saved to: {input_file}")
        print(f"Original file has been backed up to: {backup_file}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Run the update with your specific file path
if __name__ == "__main__":
    input_file = r"D:\FlagQuest\flag_quest\public\countries_simplified.json"
    update_country_subregions(input_file)