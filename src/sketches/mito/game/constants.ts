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
 * How many seconds it takes for a Cell to go from 100% to 0% energy. One sugar will sustain one
 * Cell's energy for this many seconds. "Energy" is a unit of time in this game.
 */
export const CELL_MAX_ENERGY = 225;

/**
 * How many seconds it takes to build a Cell.
 */
export const CELL_BUILD_TIME = 1;

/**
 * How quickly water diffuses through cells. Each water difference
 * between two adjacent cells will diffuse, on average, after (1 / CELL_DIFFUSION_WATER_RATE) seconds.
 */
export const CELL_DIFFUSION_WATER_RATE = 0.06;

/**
 * How quickly sugar diffuses through cells. See water rate explanation.
 */
export const CELL_DIFFUSION_SUGAR_RATE = 0.06;

/**
 * Max inventory capacity of Tissue, Transports, and Roots.
 */
export const TISSUE_INVENTORY_CAPACITY = 6;

/**
 * How quickly a Leaf will convert water into sugar. On average,
 * water will be converted after (1 / LEAF_REACTION_RATE) seconds.
 */
export const LEAF_REACTION_RATE = 0.3;

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
