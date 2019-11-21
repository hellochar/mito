/**
 * In Mito, our standard units of measurement are:
 *
 * Distance - tiles.
 * Time - seconds.
 */

/**
 * How many tiles per second the Player moves.
 */
export const PLAYER_BASE_SPEED = 3;
/**
 * How fast the Player moves from standing on Transport.
 */
export const PLAYER_MOVED_BY_TRANSPORT_SPEED = 0.3;

/**
 * Number of realtime seconds in a game year.
 */
export const TIME_PER_YEAR = 60 * 15; // 60 seconds/minute * 15 minutes
export const TIME_PER_SEASON = TIME_PER_YEAR / 4;
export const TIME_PER_MONTH = TIME_PER_SEASON / 3;
export const TIME_PER_DAY = TIME_PER_MONTH / 3;

/**
 * Water between adjacent Soil will diffuse, on average, after this many seconds.
 */
export const SOIL_DIFFUSION_WATER_TIME = 33;

export const SOIL_INVENTORY_CAPACITY = 20;

/**
 * How many seconds it takes for a Cell to go from 100% to 0% energy. One sugar will sustain one
 * Cell's energy for this many seconds. "Energy" is a unit of time in this game.
 */
export const CELL_MAX_ENERGY = 225;

/**
 * How many seconds it takes to build a Cell.
 */
export const CELL_BUILD_TIME = 1;

/**
 * In a two Cell system with one Water, this water will diffuse, on average, after this many seconds.
 * Divide this by 8 to get an idea of how "fast" a single water will move on a fully filled out Tissue plane.
 */
export const CELL_DIFFUSION_WATER_TIME = 16.6667;

/**
 * See CELL_DIFFUSION_WATER_TIME explanation.
 */
export const CELL_DIFFUSION_SUGAR_TIME = 16.6667;

/**
 * Max inventory capacity of Tissue, Transports, and Roots.
 */
export const TISSUE_INVENTORY_CAPACITY = 6;

/**
 * On average, water will be converted after LEAF_REACTION_TIME seconds.
 */
export const LEAF_REACTION_TIME = 3.3333;

/**
 * Number of seconds between Root Absorption events.
 */
export const ROOT_TIME_BETWEEN_ABSORPTIONS = 3;

/**
 * How many total resources a Fruit needs to mature.
 */
export const FRUIT_NEEDED_RESOURCES = 100;

/**
 * How long it takes for a Fruit to reach full Maturation, given that it has
 * perfect resource availability.
 */
export const FRUIT_TIME_TO_MATURE = (TIME_PER_SEASON / 3) * 2;

export const TRANSPORT_TIME_BETWEEN_TRANSFERS = 1;
