import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';
import { logger } from '../logger';

/**
 * Category Tree Caching Layer
 * 
 * Caches the entire category hierarchy for instant navigation.
 * Categories rarely change but are accessed on every page.
 * 
 * Strategy:
 * - Cache entire tree: 24-hour TTL
 * - Invalidate on any category change
 * - Reduces DB queries by 15-20%
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  parent?: string | null;
  subcategories?: Category[];
}

interface CategoryTree {
  categories: Category[];
  tree: Category[];
  cachedAt: string;
}

/**
 * Build hierarchical category tree from flat list
 */
function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create map and initialize subcategories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, subcategories: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;

    if (cat.parent) {
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        parent.subcategories!.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });

  return rootCategories;
}

/**
 * Get complete category tree from cache or DB
 */
export async function getCategoryTree(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
): Promise<CategoryTree | null> {
  try {
    const key = RedisKeys.categoryTree();
    const cached = await redis.get<CategoryTree>(key);

    if (cached) {
      logger.debug("✅ Category tree cache HIT");
      return cached;
    }

    logger.debug("⚠️ Category tree cache MISS");

    // Fetch from DB
    const result = await fetchFromDB();
    const categories = result.docs || [];

    const categoryTree: CategoryTree = {
      categories,
      tree: buildCategoryTree(categories),
      cachedAt: new Date().toISOString(),
    };

    // Cache for 24 hours
    await redis.setex(key, REDIS_CONFIG.TTL.CATEGORY_TREE, categoryTree);
    logger.debug('✅ Category tree cached');

    return categoryTree;
  } catch (error) {
    logger.error({ err: error }, 'Redis getCategoryTree error, falling back to DB');
    const result = await fetchFromDB();
    return {
      categories: result.docs || [],
      tree: buildCategoryTree(result.docs || []),
      cachedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get single category from cache or DB
 */
export async function getCategory(
  categoryId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
): Promise<Category | null> {
  try {
    const key = RedisKeys.category(categoryId);
    const cached = await redis.get<Category>(key);

    if (cached) {
      logger.debug({ categoryId }, `✅ Category cache HIT`);
      return cached;
    }

    logger.debug({ categoryId }, `⚠️ Category cache MISS`);

    const category = await fetchFromDB();

    if (category) {
      // Cache for 24 hours
      await redis.setex(key, REDIS_CONFIG.TTL.CATEGORY_TREE, category);
      logger.debug({ categoryId }, `✅ Category cached`);
    }

    return category;
  } catch (error) {
    logger.error({ err: error, categoryId }, 'Redis getCategory error, falling back to DB');
    return await fetchFromDB();
  }
}

/**
 * Invalidate entire category tree
 * Called when any category is created, updated, or deleted
 */
export async function invalidateCategoryTree(): Promise<void> {
  const operation = async () => {
    const key = RedisKeys.categoryTree();
    await redis.del(key);
    logger.info('✅ Category tree cache invalidated');
  };

  await safeRedisOperation(operation);
}

/**
 * Invalidate single category
 */
export async function invalidateCategory(categoryId: string): Promise<void> {
  const operation = async () => {
    const key = RedisKeys.category(categoryId);
    await redis.del(key);

    // Also invalidate the entire tree since hierarchy might have changed
    await invalidateCategoryTree();

    logger.info({ categoryId }, `✅ Category cache invalidated`);
  };

  await safeRedisOperation(operation);
}
