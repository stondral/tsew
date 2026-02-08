const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL || "https://track.delhivery.com";
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN;

if (!DELHIVERY_TOKEN) {
  console.warn("DELHIVERY_TOKEN is missing in environment variables. Delhivery API calls will fail.");
}

export interface DelhiveryTATParams {
  origin_pin?: string;
  destination_pin?: string;
  origin?: string;
  destination?: string;
  mot: 'S' | 'E' | 'N';
  weight?: number;
}

export interface DelhiveryCostParams {
  md: 'S' | 'E'; // Mode: Surface or Express
  gm: number;   // Weight in grams
  o_pincode: string;
  d_pincode: string;
  ss: string;    // Status of shipment (Delivered, RTO)
  pt?: 'Pre-paid' | 'COD';
  cgm?: number;  // Chargeable weight (optional)
  l?: number;    // Length in cm
  b?: number;    // Breadth in cm
  h?: number;    // Height in cm
  ipkg_type?: string; // Type of Package
}

export async function getExpectedTAT(params: DelhiveryTATParams) {
  // Use the correct EDD (Estimated Delivery Date) endpoint with /c/ prefix
  const url = new URL(`${DELHIVERY_API_URL}/c/api/v1/packages/json/`);
  const origin_pin = params.origin_pin || params.origin;
  const destination_pin = params.destination_pin || params.destination;

  if (!origin_pin || !destination_pin) {
    throw new Error("Origin and Destination pincodes are required for TAT.");
  }

  // Sanitize pincodes
  const sanitized_origin_pin = origin_pin.replace(/\s+/g, '').slice(0, 6);
  const sanitized_destination_pin = destination_pin.replace(/\s+/g, '').slice(0, 6);

  // Try both sets of parameter names for robustness
  url.searchParams.append("origin", sanitized_origin_pin); 
  url.searchParams.append("destination", sanitized_destination_pin); 
  url.searchParams.append("origin_pin", sanitized_origin_pin); 
  url.searchParams.append("destination_pin", sanitized_destination_pin); 
  
  url.searchParams.append("mot", params.mot);
  
  if (params.weight) {
    url.searchParams.append("weight", params.weight.toString());
  }

  console.log("Calling Delhivery EDD API (GET):", url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${DELHIVERY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delhivery TAT API error (${response.status}): ${errorText}`);
      throw new Error(`Delhivery TAT API error: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Delhivery TAT RAW Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Delhivery TAT fetch failed:", error);
    return null;
  }
}

export async function calculateShippingCost(params: DelhiveryCostParams) {
  // Updated endpoint as per user feedback: /api/kinko/v1/invoice/charges/.json
  const url = new URL(`${DELHIVERY_API_URL}/api/kinko/v1/invoice/charges/.json`);
  
  // Sanitize pincodes (ensure 6 digits)
  const o_pin = params.o_pincode.replace(/\s+/g, '').slice(0, 6);
  const d_pin = params.d_pincode.replace(/\s+/g, '').slice(0, 6);

  // Calculate Chargeable Weight (cgm)
  // Volumetric weight: (L*B*H)/5000 in kg => (L*B*H)/5 in grams
  const volumetricWeight = (params.l && params.b && params.h) 
    ? (params.l * params.b * params.h) / 5 
    : 0;
  const cgm = Math.round(Math.max(params.gm, volumetricWeight));

  url.searchParams.append("md", params.md);
  url.searchParams.append("ss", params.ss);
  url.searchParams.append("d_pin", d_pin);
  url.searchParams.append("o_pin", o_pin);
  url.searchParams.append("cgm", cgm.toString());
  
  // Optional but helpful
  url.searchParams.append("gm", Math.round(params.gm).toString());
  if (params.pt) url.searchParams.append("pt", params.pt);
  if (params.l) url.searchParams.append("l", params.l.toString());
  if (params.b) url.searchParams.append("b", params.b.toString());
  if (params.h) url.searchParams.append("h", params.h.toString());

  console.log("Calling Delhivery Shipping Cost API (GET):", url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${DELHIVERY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delhivery Cost API error details: ${errorText}`);
      throw new Error(`Delhivery Cost API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Delhivery Cost fetch failed:", error);
    return null;
  }
}

export interface DelhiveryWarehouseParams {
  name: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
  email?: string;
  registered_name?: string;
  return_address?: string;
}

export async function registerWarehouse(params: DelhiveryWarehouseParams) {
  const url = `${DELHIVERY_API_URL}/api/backend/clientwarehouse/create/`;
  
  const payload = {
    name: params.name,
    registered_name: params.registered_name || params.name,
    phone: params.phone,
    address: params.address,
    city: params.city,
    pin: params.pin,
    email: params.email || "",
    return_address: params.return_address || params.address,
    return_pin: params.pin,
    return_city: params.city,
    return_state: "", // Optional but good to have
    country: "India"
  };

  console.log("🏢 Registering warehouse with Delhivery:", params.name);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      // Try parsing XML response for Delhivery's native format
      console.warn("Non-JSON response from warehouse registration, attempting XML parsing");
      
      // Check if it's an "already exists" error in XML
      if (responseText.includes('already exists')) {
        console.log("✅ Warehouse already registered with Delhivery (no re-registration needed)");
        return { 
          success: true, 
          status: response.status, 
          message: "Warehouse already exists",
          already_registered: true
        };
      }
      
      data = { raw_response: responseText };
    }

    console.log("🏢 Warehouse registration response status:", response.status);

    // Success cases
    if (response.ok) {
      console.log("✅ Warehouse registered successfully");
      return { success: true, ...data };
    }

    // Handle 400 error - check if it's "already exists"
    if (response.status === 400) {
      if (responseText.includes('already exists')) {
        console.log("✅ Warehouse already registered with Delhivery (treating as success)");
        return { 
          success: true, 
          status: 400,
          message: "Warehouse already exists",
          already_registered: true,
          response: data
        };
      }
      
      // Other 400 errors
      console.error(`❌ Warehouse registration failed (400):`, responseText.substring(0, 200));
      return { 
        success: false, 
        status: response.status, 
        message: "Warehouse registration failed",
        response: data 
      };
    }

    // Other error status codes
    console.error(`❌ Warehouse registration failed (${response.status}):`, responseText.substring(0, 200));
    return { 
      success: false, 
      status: response.status, 
      response: data 
    };

  } catch (error) {
    console.error("Delhivery Warehouse registration request failed:", error);
    return { 
      success: false, 
      error: String(error),
      message: "Network error during warehouse registration"
    };
  }
}

export interface DelhiveryShipmentParams {
  pickup_location: string;
  name: string;
  add: string;
  pin: string;
  phone: string;
  order: string;
  payment_mode: 'Pre-paid' | 'COD' | 'Prepaid';
  amount: string;
  cod_amount?: string; // COD collection amount
  weight: string;
  shipping_mode: 'Surface' | 'Express';
  products_desc: string;
  hsn_code?: string;
  dimensions?: string; // L*B*H
  client?: string;
  origin?: string;    // Pincode
  consignee?: string; // Name
}

interface DelhiveryShipmentData {
  name: string;
  order: string;
  phone: string;
  add: string;
  pin: string;
  payment_mode: string;
  products_desc: string;
  pickup_location: string;
  weight: string;
  shipping_mode: string;
  country: string;
  shipment_length?: string;
  shipment_width?: string;
  shipment_height?: string;
  cod_amount?: string;
  hsn_code?: string;
  consignee?: string;
  seller_add?: string;
  seller_name?: string;
  total_amount?: string;
  [key: string]: string | undefined;
}

export async function createShipment(params: DelhiveryShipmentParams) {
  const url = `${DELHIVERY_API_URL}/api/cmu/create.json`;
  
  // Build shipment object according to official Delhivery API documentation
  // See: https://one.delhivery.com/developer-portal/document/b2c/detail/order-creation
  const shipment: DelhiveryShipmentData = {
    name: params.name,
    order: params.order,
    phone: params.phone,
    add: params.add,
    pin: params.pin,
    payment_mode: params.payment_mode, // Should be "Prepaid" or "COD"
    products_desc: params.products_desc,
    pickup_location: params.pickup_location,
    weight: params.weight,
    shipping_mode: params.shipping_mode,
    country: "India",
  };

  // Add optional fields if provided
  if (params.dimensions) {
    // Parse dimensions string "L*B*H" into separate fields
    const dims = params.dimensions.split('*').map(d => parseFloat(d.trim()));
    if (dims.length === 3) {
      shipment.shipment_length = dims[0].toString();
      shipment.shipment_width = dims[1].toString();
      shipment.shipment_height = dims[2].toString();
    }
  }
  
  // Handle COD payment specifics
  if (params.payment_mode === 'COD') {
    if (params.amount && params.amount !== '0') {
      shipment.cod_amount = params.amount;
    }
    if (params.cod_amount && params.cod_amount !== '0') {
      shipment.cod_amount = params.cod_amount;
    }
  }
  
  if (params.hsn_code) shipment.hsn_code = params.hsn_code;
  if (params.consignee) shipment.consignee = params.consignee;
  if (params.origin) shipment.seller_add = params.origin;
  if (params.client) shipment.seller_name = params.client;
  if (params.amount && params.payment_mode !== 'COD') {
    shipment.total_amount = params.amount; // For non-COD orders
  }

  const payload = {
    shipments: [shipment],
    pickup_location: {
      name: params.pickup_location
    }
  };

  const bodyData = JSON.stringify(payload);
  console.log("🚚 Constructing Delhivery Manifest payload:", bodyData);
  console.log("📋 Shipment fields:", Object.keys(shipment).join(", "));
  console.log(`💳 Payment Mode: ${params.payment_mode}${params.payment_mode === 'COD' ? ` (COD Amount: ₹${params.cod_amount || params.amount})` : ' (Prepaid)'}`);

  // Validate shipment data
  const requiredFields = ['name', 'order', 'phone', 'add', 'pin', 'payment_mode', 'products_desc', 'pickup_location', 'weight'];
  const missingInShipment = requiredFields.filter(f => !shipment[f]);
  
  // Additional validation for COD
  if (params.payment_mode === 'COD' && (!params.cod_amount || params.cod_amount === '0')) {
    console.warn("⚠️ COD order without amount specified. Using amount field:", params.amount);
  }
  
  if (missingInShipment.length > 0) {
    console.error("❌ Missing required fields in shipment:", missingInShipment);
    console.error("Shipment object:", JSON.stringify(shipment, null, 2));
    return {
      success: false,
      error: true,
      rmk: `Missing required fields: ${missingInShipment.join(', ')}`
    };
  }

  try {
    console.log("📤 Sending request to:", url);
    console.log("Authorization token present:", !!DELHIVERY_TOKEN);
    
    // Despite documentation showing application/json, Delhivery API expects form-encoded data with format=json key
    const body = `format=json&data=${encodeURIComponent(bodyData)}`;
    console.log("Body format: form-encoded with format=json key");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body
    });

    console.log("📬 Response status:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("📬 Raw response:", responseText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", parseError);
      console.error("Raw response:", responseText);
      return {
        success: false,
        error: true,
        rmk: `Invalid JSON response from Delhivery: ${responseText.substring(0, 100)}`
      };
    }

    if (!response.ok) {
      console.error(`❌ Delhivery API returned ${response.status}:`, data);
      return data || { success: false, error: true, rmk: `HTTP ${response.status}` };
    }

    console.log("✅ Delhivery Manifestation RAW result:", JSON.stringify(data, null, 2));
    
    // Check for specific error conditions and provide helpful messages
    if (!data.success) {
      if (data.packages && data.packages[0]) {
        const pkg = data.packages[0];
        
        // Check for insufficient balance
        if (pkg.remarks && typeof pkg.remarks === 'string' && pkg.remarks.includes('insufficient balance')) {
          console.error("💰 BALANCE ERROR: Delhivery prepaid account has insufficient balance");
          return { 
            ...data, 
            rmk: "Insufficient balance in Delhivery prepaid account. Please add credits at https://track.delhivery.com/",
            errorType: "INSUFFICIENT_BALANCE"
          };
        }
        
        // Check for array of remarks
        if (pkg.remarks && Array.isArray(pkg.remarks)) {
          const remarkText = pkg.remarks.flat().join(' ');
          if (remarkText.includes('insufficient balance')) {
            console.error("💰 BALANCE ERROR: Delhivery prepaid account has insufficient balance");
            return { 
              ...data, 
              rmk: "Insufficient balance in Delhivery prepaid account. Please add credits at https://track.delhivery.com/",
              errorType: "INSUFFICIENT_BALANCE"
            };
          }
        }
      }
      
      // Generic error logging
      if (data.rmk) {
        console.error("⚠️ Delhivery returned error:", data.rmk);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Delhivery Shipment creation failed:", error);
    return {
      success: false,
      error: true,
      rmk: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function schedulePickup(params: { pickup_location: string, pickup_date: string, pickup_time: string }) {
  const url = `${DELHIVERY_API_URL}/fm/request/pickup/`;
  
  const payload = {
    pickup_location: params.pickup_location,
    pickup_date: params.pickup_date,
    pickup_time: params.pickup_time,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delhivery Pickup error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Delhivery Pickup scheduling failed:", error);
    return null;
  }
}
