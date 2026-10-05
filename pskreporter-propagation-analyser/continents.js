/* DXCC entity name -> continent, following the ARRL DXCC continent assignments.
   Keys are normalised: lowercase, punctuation stripped, "and"/"&" unified. */
(function (global) {
  var EU = 'EU', NA = 'NA', SA = 'SA', AS = 'AS', AF = 'AF', OC = 'OC', AN = 'AN';

  var RAW = {
    EU: ['Albania', 'Andorra', 'Austria', 'Azores', 'Balearic Islands', 'Belarus', 'Belgium',
      'Bosnia-Herzegovina', 'Bulgaria', 'Corsica', 'Crete', 'Croatia', 'Czech Republic', 'Czechia',
      'Denmark', 'Dodecanese', 'England', 'Estonia', 'European Russia', 'European Turkey',
      'Faroe Islands', 'Fed. Rep. of Germany', 'Federal Republic of Germany', 'Germany', 'Finland',
      'France', 'Franz Josef Land', 'Gibraltar', 'Greece', 'Guernsey', 'Hungary', 'Iceland',
      'Ireland', 'Isle of Man', 'Italy', 'Jan Mayen', 'Jersey', 'Kaliningrad', 'Kosovo', 'Latvia',
      'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'North Macedonia', 'Malta',
      'Market Reef', 'Moldova', 'Monaco', 'Montenegro', 'Mount Athos', 'Mt. Athos', 'Netherlands',
      'Northern Ireland', 'Norway', 'Poland', 'Portugal', 'Republic of Kosovo', 'Romania',
      'San Marino', 'Sardinia', 'Scotland', 'Serbia', 'Shetland Islands', 'Slovak Republic',
      'Slovakia', 'Slovenia', 'Sovereign Military Order of Malta', 'Spain', 'Svalbard', 'Sweden',
      'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican', 'Vatican City', 'Wales', 'Bear Island'],

    NA: ['Alaska', 'Anguilla', 'Antigua & Barbuda', 'Aves Island', 'Bahamas', 'Barbados', 'Belize',
      'Bermuda', 'British Virgin Islands', 'Canada', 'Cayman Islands', 'Clipperton Island',
      'Costa Rica', 'Cuba', 'Desecheo Island', 'Dominica', 'Dominican Republic', 'El Salvador',
      'Greenland', 'Grenada', 'Guadeloupe', 'Guantanamo Bay', 'Guatemala', 'Haiti', 'Honduras',
      'Jamaica', 'Martinique', 'Mexico', 'Montserrat', 'Navassa Island', 'Nicaragua', 'Panama',
      'Puerto Rico', 'Revillagigedo', 'Saba & St. Eustatius', 'Saint Barthelemy', 'Saint Martin',
      'Sint Maarten', 'St. Kitts & Nevis', 'St. Lucia', 'St. Pierre & Miquelon', 'St. Vincent',
      'Turks & Caicos Islands', 'United States', 'United States of America', 'USA',
      'US Virgin Islands', 'Virgin Islands'],

    SA: ['Argentina', 'Aruba', 'Bolivia', 'Bonaire', 'Brazil', 'Chile', 'Colombia', 'Curacao',
      'Easter Island', 'Ecuador', 'Falkland Islands', 'Fernando de Noronha', 'French Guiana',
      'Galapagos Islands', 'Guyana', 'Juan Fernandez Islands', 'Paraguay', 'Peru',
      'San Felix & San Ambrosio', 'South Georgia Island', 'South Orkney Islands',
      'South Sandwich Islands', 'South Shetland Islands', 'St. Peter & St. Paul Rocks', 'Suriname',
      'Trindade & Martim Vaz Islands', 'Trinidad & Tobago', 'Uruguay', 'Venezuela'],

    AS: ['Afghanistan', 'Andaman & Nicobar Islands', 'Armenia', 'Asiatic Russia', 'Asiatic Turkey',
      'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus',
      'Democratic Peoples Rep. of Korea', 'North Korea', 'Georgia', 'Hong Kong', 'India',
      'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan',
      'Lakshadweep Islands', 'Laos', 'Lebanon', 'Macao', 'Maldives', 'Mongolia', 'Myanmar',
      'Nepal', 'Ogasawara', 'Oman', 'Pakistan', 'Palestine', 'Pratas Island', 'Qatar',
      'Republic of Korea', 'South Korea', 'Saudi Arabia', 'Scarborough Reef', 'Singapore',
      'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Turkey', 'Turkmenistan',
      'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'West Malaysia', 'Yemen'],

    AF: ['Agalega & St. Brandon', 'Algeria', 'Angola', 'Annobon Island', 'Ascension Island',
      'Benin', 'Botswana', 'Bouvet', 'Burkina Faso', 'Burundi', 'Cameroon', 'Canary Islands',
      'Cape Verde', 'Central African Republic', 'Central Africa', 'Ceuta & Melilla', 'Chad',
      'Chagos Islands', 'Comoros', 'Congo', 'Crozet Island', 'Democratic Republic of the Congo',
      'DR Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia',
      'Europa Island', 'Gabon', 'Gambia', 'Ghana', 'Glorioso Islands', 'Guinea', 'Guinea-Bissau',
      'Ivory Coast', 'Juan de Nova Europa', 'Kenya', 'Kerguelen Islands', 'Lesotho', 'Liberia',
      'Libya', 'Madagascar', 'Madeira Islands', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
      'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
      'Prince Edward & Marion Islands', 'Reunion', 'Rodriguez Island', 'Rwanda',
      'Sao Tome & Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
      'South Sudan', 'St. Helena', 'Sudan', 'Swaziland', 'Tanzania',
      'Amsterdam & St. Paul Islands', 'Togo', 'Tristan da Cunha & Gough Islands', 'Tromelin Island',
      'Tunisia', 'Uganda', 'Western Sahara', 'Zambia', 'Zimbabwe'],

    OC: ['American Samoa', 'Australia', 'Austral Islands', 'Baker & Howland Islands', 'Banaba',
      'Belau', 'Palau', 'Chatham Islands', 'Chesterfield Islands', 'Christmas Island',
      'Cocos (Keeling) Islands', 'Cocos Keeling Islands', 'Conway Reef', 'Cook Islands',
      'East Malaysia', 'Fiji', 'French Polynesia', 'Guam', 'Hawaii', 'Indonesia',
      'Johnston Island', 'Kermadec Islands', 'Kiribati', 'Lord Howe Island', 'Macquarie Island',
      'Mariana Islands', 'Marquesas Islands', 'Marshall Islands', 'Mellish Reef', 'Micronesia',
      'Midway Island', 'Minami Torishima', 'Nauru', 'New Caledonia', 'New Zealand', 'Niue',
      'Norfolk Island', 'Papua New Guinea', 'Philippines', 'Pitcairn Island', 'Rotuma Island',
      'Samoa', 'Solomon Islands', 'Temotu Province', 'Timor-Leste', 'East Timor',
      'Tokelau Islands', 'Tonga', 'Tuvalu', 'Vanuatu', 'Wake Island',
      'Wallis & Futuna Islands', 'Willis Island'],

    AN: ['Antarctica', 'Peter 1 Island']
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\band\b/g, '&')
      .replace(/[^a-z0-9&]+/g, '');
  }

  var BY_NAME = {};
  Object.keys(RAW).forEach(function (cont) {
    RAW[cont].forEach(function (name) { BY_NAME[norm(name)] = cont; });
  });

  /* Coarse geographic fallback, used only when the country name is unknown.
     Ordered: the first matching rule wins. */
  function byLatLon(lat, lon) {
    if (lat === null || lon === null) return null;
    if (lat <= -60) return AN;
    if (lon >= 95 && lon <= 141 && lat >= -11 && lat <= 6) return OC;   // Indonesia
    if (lon >= 116 && lon <= 127 && lat >= 4 && lat <= 20) return OC;   // Philippines
    if (lon >= 109 && lon <= 180 && lat <= 0) return OC;                // AU / PNG / Pacific SW
    if (lon >= 155 && lon <= 180 && lat <= 25) return OC;
    if (lon >= -180 && lon <= -130 && lat >= -35 && lat <= 30) return OC; // Pacific incl. Hawaii
    if (lat >= 36 && lat <= 72 && lon >= -25 && lon <= 40) return EU;
    if (lat >= 45 && lat <= 72 && lon > 40 && lon <= 60) return EU;     // European Russia
    if (lat >= -36 && lat < 36 && lon >= -26 && lon <= 52) return AF;
    if (lat >= -36 && lat <= 0 && lon > 52 && lon <= 60) return AF;     // Mascarenes
    if (lat >= -11 && lat <= 82 && lon >= 25 && lon <= 180) return AS;
    if (lon >= -170 && lon <= -25) {
      if (lat >= 13) return NA;
      if (lat >= 7 && lon >= -84) return SA;                            // N. Colombia / Venezuela
      if (lat >= 7) return NA;                                          // Panama / Costa Rica
      return SA;
    }
    return null;
  }

  global.Continents = {
    ORDER: [EU, NA, SA, AS, AF, OC, AN],
    LABEL: {
      EU: 'Europe', NA: 'North America', SA: 'South America', AS: 'Asia',
      AF: 'Africa', OC: 'Oceania', AN: 'Antarctica', XX: 'Unidentified'
    },
    byCountry: function (country) { return BY_NAME[norm(country)] || null; },
    byLatLon: byLatLon
  };
})(window);
