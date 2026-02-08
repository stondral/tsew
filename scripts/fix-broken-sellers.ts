
import 'dotenv/config';
import config from '../payload.config';
import { getPayload } from 'payload';
import fs from 'fs';

const LOG_FILE = 'debug_migration.log';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function fixBrokenSellers() {
  try {
    fs.writeFileSync(LOG_FILE, ''); // Clear log file
    
    const payload = await getPayload({ config });
    const VALID_SELLER_ID = "69838d344013ae841d483c99"; // StondEmporiums's Store

    log('Starting fix for broken seller references...');
    log(`Target Valid Seller ID: ${VALID_SELLER_ID}`);

    // 1. Find all products
    const products = await payload.find({
      collection: 'products',
      limit: 1000, 
      depth: 0, 
    });

    log(`Scanned ${products.totalDocs} products.`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorsCount = 0;

    for (const [index, p] of products.docs.entries()) {
      const currentSellerId = typeof p.seller === 'string' ? p.seller : (p.seller as any)?.id;

      if (index < 5) {
          log(`DEBUG Product [${index}]: ${p.name}`);
          log(`DEBUG Seller Field: ${JSON.stringify(p.seller)}`);
          log(`DEBUG Computed Seller ID: ${currentSellerId}`);
          log(`DEBUG Comparison: ${currentSellerId} !== ${VALID_SELLER_ID} -> ${currentSellerId !== VALID_SELLER_ID}`);
      }
      
      if (currentSellerId !== VALID_SELLER_ID) {
        try {
            log(`Updating product "${p.name}" (ID: ${p.id}). Old Seller: ${currentSellerId} -> New Seller: ${VALID_SELLER_ID}`);
            
            const result = await payload.update({
                collection: 'products',
                id: p.id,
                data: {
                    seller: VALID_SELLER_ID
                }
            });
            log(`Update Result Seller: ${JSON.stringify(result.seller)}`);

            fixedCount++;
        } catch (err) {
            log(`Failed to update product ${p.id}: ${err}`);
            errorsCount++;
        }
      } else {
          skippedCount++;
      }
    }

    log('-----------------------------------');
    log(`Fix Complete.`);
    log(`Updated: ${fixedCount}`);
    log(`Skipped (Already Correct): ${skippedCount}`);
    log(`Errors: ${errorsCount}`);

  } catch (e) {
    log(`Fatal Error: ${e}`);
  }
  process.exit(0);
}

fixBrokenSellers();
