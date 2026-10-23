/**
 * Indian States, Cities & Pincode Directory
 * Provides instant offline matching & auto-fill for Dealership Location Setup
 */

export interface CityData {
  city: string;
  state: string;
  pincode: string;
}

export const INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const POPULAR_CITIES: CityData[] = [
  // Maharashtra
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  { city: 'Nagpur', state: 'Maharashtra', pincode: '440001' },
  { city: 'Thane', state: 'Maharashtra', pincode: '400601' },
  { city: 'Nashik', state: 'Maharashtra', pincode: '422001' },
  { city: 'Aurangabad', state: 'Maharashtra', pincode: '431001' },
  { city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400703' },
  { city: 'Solapur', state: 'Maharashtra', pincode: '413001' },
  { city: 'Kolhapur', state: 'Maharashtra', pincode: '416001' },
  { city: 'Amravati', state: 'Maharashtra', pincode: '444601' },

  // Delhi NCR / Haryana / UP
  { city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'Gurugram', state: 'Haryana', pincode: '122001' },
  { city: 'Faridabad', state: 'Haryana', pincode: '121001' },
  { city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
  { city: 'Greater Noida', state: 'Uttar Pradesh', pincode: '201310' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201001' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001' },
  { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
  { city: 'Agra', state: 'Uttar Pradesh', pincode: '282001' },
  { city: 'Prayagraj', state: 'Uttar Pradesh', pincode: '211001' },
  { city: 'Meerut', state: 'Uttar Pradesh', pincode: '250001' },
  { city: 'Bareilly', state: 'Uttar Pradesh', pincode: '243001' },
  { city: 'Gorakhpur', state: 'Uttar Pradesh', pincode: '273001' },

  // Karnataka
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  { city: 'Mysuru', state: 'Karnataka', pincode: '570001' },
  { city: 'Mangaluru', state: 'Karnataka', pincode: '575001' },
  { city: 'Hubballi', state: 'Karnataka', pincode: '580020' },
  { city: 'Belagavi', state: 'Karnataka', pincode: '590001' },
  { city: 'Kalaburagi', state: 'Karnataka', pincode: '585101' },

  // Tamil Nadu
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001' },
  { city: 'Madurai', state: 'Tamil Nadu', pincode: '625001' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', pincode: '620001' },
  { city: 'Salem', state: 'Tamil Nadu', pincode: '636001' },
  { city: 'Tirunelveli', state: 'Tamil Nadu', pincode: '627001' },

  // Telangana & Andhra Pradesh
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Secunderabad', state: 'Telangana', pincode: '500003' },
  { city: 'Warangal', state: 'Telangana', pincode: '506002' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530001' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '520001' },
  { city: 'Guntur', state: 'Andhra Pradesh', pincode: '522002' },
  { city: 'Nellore', state: 'Andhra Pradesh', pincode: '524001' },
  { city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501' },

  // Gujarat
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
  { city: 'Surat', state: 'Gujarat', pincode: '395001' },
  { city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
  { city: 'Rajkot', state: 'Gujarat', pincode: '360001' },
  { city: 'Gandhinagar', state: 'Gujarat', pincode: '382010' },
  { city: 'Bhavnagar', state: 'Gujarat', pincode: '364001' },
  { city: 'Jamnagar', state: 'Gujarat', pincode: '361001' },

  // Rajasthan
  { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
  { city: 'Jodhpur', state: 'Rajasthan', pincode: '342001' },
  { city: 'Udaipur', state: 'Rajasthan', pincode: '313001' },
  { city: 'Kota', state: 'Rajasthan', pincode: '324001' },
  { city: 'Bikaner', state: 'Rajasthan', pincode: '334001' },
  { city: 'Ajmer', state: 'Rajasthan', pincode: '305001' },

  // West Bengal
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  { city: 'Howrah', state: 'West Bengal', pincode: '711101' },
  { city: 'Siliguri', state: 'West Bengal', pincode: '734001' },
  { city: 'Asansol', state: 'West Bengal', pincode: '713301' },
  { city: 'Durgapur', state: 'West Bengal', pincode: '713201' },

  // Madhya Pradesh & Chhattisgarh
  { city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001' },
  { city: 'Jabalpur', state: 'Madhya Pradesh', pincode: '482001' },
  { city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474001' },
  { city: 'Ujjain', state: 'Madhya Pradesh', pincode: '456001' },
  { city: 'Raipur', state: 'Chhattisgarh', pincode: '492001' },
  { city: 'Bhilai', state: 'Chhattisgarh', pincode: '490006' },
  { city: 'Bilaspur', state: 'Chhattisgarh', pincode: '495001' },

  // Punjab & Chandigarh
  { city: 'Chandigarh', state: 'Chandigarh', pincode: '160017' },
  { city: 'Ludhiana', state: 'Punjab', pincode: '141001' },
  { city: 'Amritsar', state: 'Punjab', pincode: '143001' },
  { city: 'Jalandhar', state: 'Punjab', pincode: '144001' },
  { city: 'Patiala', state: 'Punjab', pincode: '147001' },
  { city: 'Bathinda', state: 'Punjab', pincode: '151001' },

  // Kerala
  { city: 'Kochi', state: 'Kerala', pincode: '682001' },
  { city: 'Thiruvananthapuram', state: 'Kerala', pincode: '695001' },
  { city: 'Kozhikode', state: 'Kerala', pincode: '673001' },
  { city: 'Thrissur', state: 'Kerala', pincode: '680001' },
  { city: 'Kollam', state: 'Kerala', pincode: '691001' },

  // Bihar & Jharkhand
  { city: 'Patna', state: 'Bihar', pincode: '800001' },
  { city: 'Gaya', state: 'Bihar', pincode: '823001' },
  { city: 'Muzaffarpur', state: 'Bihar', pincode: '842001' },
  { city: 'Bhagalpur', state: 'Bihar', pincode: '812001' },
  { city: 'Ranchi', state: 'Jharkhand', pincode: '834001' },
  { city: 'Jamshedpur', state: 'Jharkhand', pincode: '831001' },
  { city: 'Dhanbad', state: 'Jharkhand', pincode: '826001' },

  // Odisha
  { city: 'Bhubaneswar', state: 'Odisha', pincode: '751001' },
  { city: 'Cuttack', state: 'Odisha', pincode: '753001' },
  { city: 'Rourkela', state: 'Odisha', pincode: '769001' },

  // Uttarakhand & Himachal
  { city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' },
  { city: 'Haridwar', state: 'Uttarakhand', pincode: '249401' },
  { city: 'Shimla', state: 'Himachal Pradesh', pincode: '171001' },

  // Goa
  { city: 'Panaji', state: 'Goa', pincode: '403001' },
  { city: 'Margao', state: 'Goa', pincode: '403601' },

  // North East & J&K
  { city: 'Guwahati', state: 'Assam', pincode: '781001' },
  { city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' },
  { city: 'Jammu', state: 'Jammu & Kashmir', pincode: '180001' },
  { city: 'Shillong', state: 'Meghalaya', pincode: '793001' },
  { city: 'Imphal', state: 'Manipur', pincode: '795001' },
  { city: 'Puducherry', state: 'Puducherry', pincode: '605001' },
  { city: 'Aizawl', state: 'Mizoram', pincode: '796001' },
  { city: 'Kohima', state: 'Nagaland', pincode: '797001' },
  { city: 'Agartala', state: 'Tripura', pincode: '799001' },
  { city: 'Gangtok', state: 'Sikkim', pincode: '737101' },
  { city: 'Itanagar', state: 'Arunachal Pradesh', pincode: '791111' },
  { city: 'Leh', state: 'Ladakh', pincode: '194101' },
  { city: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', pincode: '396210' },
  { city: 'Kalyan', state: 'Maharashtra', pincode: '421301' },
  { city: 'Satara', state: 'Maharashtra', pincode: '415001' },
  { city: 'Ahmednagar', state: 'Maharashtra', pincode: '414001' },
  { city: 'Panipat', state: 'Haryana', pincode: '132103' },
  { city: 'Rohtak', state: 'Haryana', pincode: '124001' },
  { city: 'Mohali', state: 'Punjab', pincode: '140308' },
  { city: 'Port Blair', state: 'Andaman and Nicobar Islands', pincode: '744101' },
  { city: 'Kavaratti', state: 'Lakshadweep', pincode: '682555' },
];

/**
 * 3-digit and 2-digit Pincode Prefix to City & State Resolver
 */
const PINCODE_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  // Delhi
  '110': { city: 'Delhi', state: 'Delhi' },

  // Haryana
  '121': { city: 'Faridabad', state: 'Haryana' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '124': { city: 'Rohtak', state: 'Haryana' },
  '125': { city: 'Hisar', state: 'Haryana' },
  '131': { city: 'Sonipat', state: 'Haryana' },
  '132': { city: 'Karnal', state: 'Haryana' },
  '133': { city: 'Ambala', state: 'Haryana' },
  '134': { city: 'Panchkula', state: 'Haryana' },

  // Punjab
  '140': { city: 'Mohali', state: 'Punjab' },
  '141': { city: 'Ludhiana', state: 'Punjab' },
  '143': { city: 'Amritsar', state: 'Punjab' },
  '144': { city: 'Jalandhar', state: 'Punjab' },
  '147': { city: 'Patiala', state: 'Punjab' },
  '151': { city: 'Bathinda', state: 'Punjab' },

  // Chandigarh
  '160': { city: 'Chandigarh', state: 'Chandigarh' },

  // Himachal Pradesh
  '171': { city: 'Shimla', state: 'Himachal Pradesh' },
  '176': { city: 'Dharamshala', state: 'Himachal Pradesh' },

  // J&K
  '180': { city: 'Jammu', state: 'Jammu & Kashmir' },
  '190': { city: 'Srinagar', state: 'Jammu & Kashmir' },

  // UP
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '202': { city: 'Aligarh', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '211': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '243': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '244': { city: 'Moradabad', state: 'Uttar Pradesh' },
  '250': { city: 'Meerut', state: 'Uttar Pradesh' },
  '273': { city: 'Gorakhpur', state: 'Uttar Pradesh' },
  '282': { city: 'Agra', state: 'Uttar Pradesh' },

  // Uttarakhand
  '248': { city: 'Dehradun', state: 'Uttarakhand' },
  '249': { city: 'Haridwar', state: 'Uttarakhand' },

  // Rajasthan
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '305': { city: 'Ajmer', state: 'Rajasthan' },
  '313': { city: 'Udaipur', state: 'Rajasthan' },
  '324': { city: 'Kota', state: 'Rajasthan' },
  '334': { city: 'Bikaner', state: 'Rajasthan' },
  '342': { city: 'Jodhpur', state: 'Rajasthan' },

  // Gujarat
  '360': { city: 'Rajkot', state: 'Gujarat' },
  '361': { city: 'Jamnagar', state: 'Gujarat' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '382': { city: 'Gandhinagar', state: 'Gujarat' },
  '390': { city: 'Vadodara', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },

  // Maharashtra & Goa
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '401': { city: 'Thane', state: 'Maharashtra' },
  '403': { city: 'Panaji', state: 'Goa' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '413': { city: 'Solapur', state: 'Maharashtra' },
  '416': { city: 'Kolhapur', state: 'Maharashtra' },
  '422': { city: 'Nashik', state: 'Maharashtra' },
  '431': { city: 'Aurangabad', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '444': { city: 'Amravati', state: 'Maharashtra' },

  // Madhya Pradesh & Chhattisgarh
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '456': { city: 'Ujjain', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '474': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '482': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  '490': { city: 'Bhilai', state: 'Chhattisgarh' },
  '492': { city: 'Raipur', state: 'Chhattisgarh' },

  // Telangana & Andhra
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '506': { city: 'Warangal', state: 'Telangana' },
  '517': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '522': { city: 'Guntur', state: 'Andhra Pradesh' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '575': { city: 'Mangaluru', state: 'Karnataka' },
  '580': { city: 'Hubballi', state: 'Karnataka' },
  '590': { city: 'Belagavi', state: 'Karnataka' },

  // Tamil Nadu
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '620': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '625': { city: 'Madurai', state: 'Tamil Nadu' },
  '636': { city: 'Salem', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },

  // Kerala
  '673': { city: 'Kozhikode', state: 'Kerala' },
  '680': { city: 'Thrissur', state: 'Kerala' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },

  // West Bengal
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '711': { city: 'Howrah', state: 'West Bengal' },
  '713': { city: 'Asansol', state: 'West Bengal' },
  '734': { city: 'Siliguri', state: 'West Bengal' },

  // Odisha
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '753': { city: 'Cuttack', state: 'Odisha' },

  // North East & UTs
  '781': { city: 'Guwahati', state: 'Assam' },
  '791': { city: 'Itanagar', state: 'Arunachal Pradesh' },
  '793': { city: 'Shillong', state: 'Meghalaya' },
  '795': { city: 'Imphal', state: 'Manipur' },
  '796': { city: 'Aizawl', state: 'Mizoram' },
  '797': { city: 'Kohima', state: 'Nagaland' },
  '799': { city: 'Agartala', state: 'Tripura' },
  '737': { city: 'Gangtok', state: 'Sikkim' },
  '194': { city: 'Leh', state: 'Ladakh' },
  '396': { city: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu' },
  '605': { city: 'Puducherry', state: 'Puducherry' },
  '744': { city: 'Port Blair', state: 'Andaman and Nicobar Islands' },

  // Additional Maharashtra & Western India
  '402': { city: 'Raigad / Alibaug', state: 'Maharashtra' },
  '410': { city: 'Navi Mumbai', state: 'Maharashtra' },
  '412': { city: 'Pune Rural', state: 'Maharashtra' },
  '414': { city: 'Ahmednagar', state: 'Maharashtra' },
  '415': { city: 'Satara', state: 'Maharashtra' },
  '421': { city: 'Kalyan', state: 'Maharashtra' },
  '423': { city: 'Malegaon', state: 'Maharashtra' },
  '424': { city: 'Dhule', state: 'Maharashtra' },
  '425': { city: 'Jalgaon', state: 'Maharashtra' },
  '445': { city: 'Yavatmal', state: 'Maharashtra' },

  // Bihar & Jharkhand
  '800': { city: 'Patna', state: 'Bihar' },
  '826': { city: 'Dhanbad', state: 'Jharkhand' },
  '831': { city: 'Jamshedpur', state: 'Jharkhand' },
  '834': { city: 'Ranchi', state: 'Jharkhand' },
};

/**
 * 2-Digit state prefix fallback
 */
const STATE_2DIGIT_MAP: Record<string, string> = {
  '11': 'Delhi',
  '12': 'Haryana',
  '13': 'Haryana',
  '14': 'Punjab',
  '15': 'Punjab',
  '16': 'Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu & Kashmir',
  '19': 'Jammu & Kashmir',
  '20': 'Uttar Pradesh',
  '21': 'Uttar Pradesh',
  '22': 'Uttar Pradesh',
  '23': 'Uttar Pradesh',
  '24': 'Uttar Pradesh',
  '25': 'Uttar Pradesh',
  '26': 'Uttar Pradesh',
  '27': 'Uttar Pradesh',
  '28': 'Uttar Pradesh',
  '30': 'Rajasthan',
  '31': 'Rajasthan',
  '32': 'Rajasthan',
  '33': 'Rajasthan',
  '34': 'Rajasthan',
  '36': 'Gujarat',
  '37': 'Gujarat',
  '38': 'Gujarat',
  '39': 'Gujarat',
  '40': 'Maharashtra',
  '41': 'Maharashtra',
  '42': 'Maharashtra',
  '43': 'Maharashtra',
  '44': 'Maharashtra',
  '45': 'Madhya Pradesh',
  '46': 'Madhya Pradesh',
  '47': 'Madhya Pradesh',
  '48': 'Madhya Pradesh',
  '49': 'Chhattisgarh',
  '50': 'Telangana',
  '51': 'Andhra Pradesh',
  '52': 'Andhra Pradesh',
  '53': 'Andhra Pradesh',
  '56': 'Karnataka',
  '57': 'Karnataka',
  '58': 'Karnataka',
  '59': 'Karnataka',
  '60': 'Tamil Nadu',
  '61': 'Tamil Nadu',
  '62': 'Tamil Nadu',
  '63': 'Tamil Nadu',
  '64': 'Tamil Nadu',
  '67': 'Kerala',
  '68': 'Kerala',
  '69': 'Kerala',
  '70': 'West Bengal',
  '71': 'West Bengal',
  '72': 'West Bengal',
  '73': 'West Bengal',
  '74': 'West Bengal',
  '75': 'Odisha',
  '76': 'Odisha',
  '77': 'Odisha',
  '78': 'Assam',
  '79': 'North Eastern States',
  '80': 'Bihar',
  '81': 'Bihar',
  '82': 'Jharkhand',
  '83': 'Jharkhand',
  '84': 'Bihar',
  '85': 'Bihar',
};

/**
 * Instant Synchronous Pincode Lookup
 */
export function lookupPincode(pincode: string): { city: string; state: string } | null {
  const clean = pincode.replace(/\D/g, '');
  if (clean.length < 3) return null;

  // 1. Direct match in popular cities
  const direct = POPULAR_CITIES.find((c) => c.pincode === clean);
  if (direct) {
    return { city: direct.city, state: direct.state };
  }

  // 2. 3-digit prefix lookup
  const p3 = clean.slice(0, 3);
  if (PINCODE_PREFIX_MAP[p3]) {
    return PINCODE_PREFIX_MAP[p3];
  }

  // 3. 2-digit state prefix lookup
  const p2 = clean.slice(0, 2);
  if (STATE_2DIGIT_MAP[p2]) {
    return { city: '', state: STATE_2DIGIT_MAP[p2] };
  }

  return null;
}

/**
 * Asynchronous online lookup with fallback
 */
export async function fetchPincodeDetails(pincode: string): Promise<{ city: string; state: string } | null> {
  const clean = pincode.replace(/\D/g, '');
  if (clean.length !== 6) return null;

  // Try direct cache first
  const local = lookupPincode(clean);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Division || local?.city || '';
        const state = po.State || local?.state || '';
        if (state) {
          return { city, state };
        }
      }
    }
  } catch (err) {
    // network or abort, ignore and use local
  }

  return local;
}

/**
 * Get State and default Pincode by City name
 */
export function getStateAndPincodeForCity(cityName: string): { state: string; pincode: string } | null {
  if (!cityName) return null;
  const match = POPULAR_CITIES.find(
    (c) => c.city.toLowerCase() === cityName.toLowerCase().trim()
  );
  if (match) {
    return { state: match.state, pincode: match.pincode };
  }
  return null;
}
