import { params } from "game/params";

/**
 * Sandbox mode utilities for modifying game mechanics
 */
export class SandboxMode {
  private static instance: SandboxMode | null = null;
  
  private constructor() {}
  
  public static getInstance(): SandboxMode {
    if (!SandboxMode.instance) {
      SandboxMode.instance = new SandboxMode();
    }
    return SandboxMode.instance;
  }
  
  /**
   * Check if sandbox mode is currently enabled
   */
  public isEnabled(): boolean {
    return params.sandboxMode;
  }
  
  /**
   * Modify resource values in sandbox mode
   */
  public modifyResource(playerInventory: any, resource: string, amount: number): void {
    if (!this.isEnabled()) {
      return;
    }
    
    // This would interface with the actual inventory system
    switch (resource) {
      case 'sugar':
        if (playerInventory.sugar !== undefined) {
          playerInventory.sugar = Math.max(0, playerInventory.sugar + amount);
        }
        break;
      case 'water':
        if (playerInventory.water !== undefined) {
          playerInventory.water = Math.max(0, playerInventory.water + amount);
        }
        break;
      case 'co2':
        if (playerInventory.co2 !== undefined) {
          playerInventory.co2 = Math.max(0, playerInventory.co2 + amount);
        }
        break;
    }
  }
  
  /**
   * Check if infinite resources are enabled
   */
  public hasInfiniteResources(): boolean {
    return this.isEnabled() && params.infiniteResources;
  }
  
  /**
   * Check if environmental threats are disabled
   */
  public hasNoEnvironmentalThreats(): boolean {
    return this.isEnabled() && params.noEnvironmentalThreats;
  }
  
  /**
   * Get the current game speed multiplier
   */
  public getSpeedMultiplier(): number {
    if (!this.isEnabled()) {
      return 1;
    }
    return params.gameSpeedMultiplier || 1;
  }
  
  /**
   * Set game speed multiplier
   */
  public setSpeedMultiplier(multiplier: number): void {
    if (!this.isEnabled()) {
      return;
    }
    params.gameSpeedMultiplier = multiplier;
  }
  
  /**
   * Apply sandbox modifications to resource consumption
   */
  public modifyResourceConsumption(originalConsumption: number): number {
    if (!this.isEnabled()) {
      return originalConsumption;
    }
    
    if (this.hasInfiniteResources()) {
      return 0; // No resource consumption in infinite mode
    }
    
    return originalConsumption;
  }
  
  /**
   * Apply sandbox modifications to environmental damage
   */
  public modifyEnvironmentalDamage(originalDamage: number): number {
    if (!this.isEnabled()) {
      return originalDamage;
    }
    
    if (this.hasNoEnvironmentalThreats()) {
      return 0; // No environmental damage
    }
    
    return originalDamage;
  }
  
  /**
   * Apply sandbox modifications to game tick timing
   */
  public modifyTickTiming(originalDelay: number): number {
    if (!this.isEnabled()) {
      return originalDelay;
    }
    
    const speedMultiplier = this.getSpeedMultiplier();
    return originalDelay / speedMultiplier;
  }
}

// Export singleton instance
export const sandboxMode = SandboxMode.getInstance();

// Extend params interface to include sandbox-specific options
declare module "game/params" {
  interface Params {
    infiniteResources?: boolean;
    noEnvironmentalThreats?: boolean;
    gameSpeedMultiplier?: number;
  }
}
