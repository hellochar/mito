# 🧪 Sandbox Mode Documentation

## Overview

Sandbox Mode is a new creative game mode for Mito that removes survival constraints and provides players with powerful tools to experiment, learn, and create without limitations.

## Features

### 🎮 Game Mode Selection
- **Accessible from Start Screen**: Choose between Normal Mode and Sandbox Mode when starting a new game
- **Mode Persistence**: Your mode choice is remembered across sessions
- **Visual Indicators**: Clear UI indicators show when Sandbox Mode is active

### 🔧 Sandbox Controls Panel
When in Sandbox Mode, a control panel appears in the top-right corner with the following options:

#### Resource Management
- **Add Resources**: Instantly add Sugar, Water, or CO₂ to your plant
- **Custom Amounts**: Specify exact quantities to add
- **Infinite Resources Toggle**: Enable unlimited resources (no consumption)

#### Environment Control
- **Force Night Mode**: Toggle day/night cycle override
- **Disable Environmental Threats**: Remove insects, weather damage, and other hazards
- **Season Control**: (Future feature) Control seasonal changes

#### Time Control
- **Speed Multipliers**: Control game speed (0.5x, 1x, 2x, 5x)
- **Pause/Resume**: (Future feature) Pause simulation entirely

### 🌱 Enhanced Learning Experience
- **No Failure States**: Plants won't die from resource starvation
- **Experiment Freely**: Test different growth strategies without consequences
- **Focus on Biology**: Learn plant mechanics without survival pressure

## Technical Implementation

### Core Components

#### 1. Parameter System (`src/game/params.ts`)
```typescript
const PARAMS_DEFAULT = {
  // ... existing params
  sandboxMode: false, // New sandbox mode parameter
};

export function setSandboxMode(enabled: boolean) {
  params.sandboxMode = enabled;
  updateParamsHash();
}
```

#### 2. Sandbox Controls (`src/game/ui/sandbox/SandboxControls.tsx`)
- React component providing sandbox UI controls
- Callback system for resource/environment modifications
- Only visible when `params.sandboxMode` is true

#### 3. Sandbox Utilities (`src/core/sandbox.ts`)
```typescript
export class SandboxMode {
  // Singleton pattern for global access
  public modifyResource(inventory: any, resource: string, amount: number): void
  public hasInfiniteResources(): boolean
  public getSpeedMultiplier(): number
  // ... other utility methods
}
```

#### 4. UI Integration
- **Start Screen**: Mode selection interface
- **Mito Screen**: Sandbox controls overlay
- **Visual Indicators**: CSS classes and styling for sandbox mode

### Integration Points

To fully implement sandbox mode functionality, the following game systems need integration:

#### Resource System Integration
```typescript
// In resource consumption code
const consumption = sandboxMode.modifyResourceConsumption(originalConsumption);
```

#### Environmental System Integration
```typescript
// In environmental damage code
const damage = sandboxMode.modifyEnvironmentalDamage(originalDamage);
```

#### Game Loop Integration
```typescript
// In game tick timing
const tickDelay = sandboxMode.modifyTickTiming(baseTickDelay);
```

## Usage Guide

### For Players

1. **Starting Sandbox Mode**
   - Launch Mito
   - Click "Continue Game"
   - Select "Sandbox Mode" from the mode selection screen
   - Click "Start Sandbox Game"

2. **Using Sandbox Controls**
   - Look for the control panel in the top-right corner
   - Use resource controls to add materials to your plant
   - Toggle environment settings to modify game conditions
   - Adjust speed controls to slow down or speed up the simulation

3. **Educational Benefits**
   - Experiment with different plant structures without survival pressure
   - Learn about resource flows and plant biology
   - Test extreme scenarios and edge cases
   - Focus on creativity and exploration

### For Developers

#### Adding New Sandbox Features

1. **Add Parameter**
```typescript
// In params.ts
const PARAMS_DEFAULT = {
  // ... existing params
  newSandboxFeature: false,
};
```

2. **Add UI Control**
```typescript
// In SandboxControls.tsx
<label>
  <input
    type="checkbox"
    checked={newFeatureEnabled}
    onChange={handleNewFeatureToggle}
  />
  New Feature
</label>
```

3. **Add Game Logic**
```typescript
// In sandbox.ts
public hasNewFeature(): boolean {
  return this.isEnabled() && params.newSandboxFeature;
}
```

4. **Integrate with Game Systems**
```typescript
// In relevant game code
if (sandboxMode.hasNewFeature()) {
  // Apply sandbox modification
}
```

## Future Enhancements

### Planned Features
- **Save/Load Plant Configurations**: Export and import plant designs
- **Advanced Environment Controls**: Weather, soil chemistry, season control
- **Genetic Engineering Mode**: Direct manipulation of plant genetics
- **Performance Analytics**: Real-time efficiency measurements
- **Teaching Mode**: Step-by-step guided learning experiences

### Community Features
- **Sandbox Creations Gallery**: Share interesting plant designs
- **Challenge Mode**: Community-created scenarios
- **Modding Support**: Plugin system for custom sandbox tools

## Contributing

To contribute to sandbox mode development:

1. **Fork the repository**
2. **Create a feature branch** from `feature/sandbox-mode`
3. **Implement your feature** following the patterns established
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

### Development Guidelines

- Follow the existing code style and patterns
- Use TypeScript for type safety
- Add appropriate error handling
- Consider performance implications
- Test in both sandbox and normal modes
- Update this documentation for new features

## Troubleshooting

### Common Issues

**Q: Sandbox controls not appearing**
A: Ensure you selected "Sandbox Mode" from the start screen. Check that `params.sandboxMode` is true.

**Q: Resource additions not working**
A: The current implementation provides console logging. Full integration with the game's resource system requires additional development.

**Q: Speed controls not affecting game**
A: Speed control integration requires modification of the game's main loop timing.

### Debug Information

To check sandbox mode status:
```javascript
// In browser console
console.log('Sandbox mode:', params.sandboxMode);
console.log('Infinite resources:', params.infiniteResources);
console.log('Speed multiplier:', params.gameSpeedMultiplier);
```

## Version History

### v0.9.1-dev (Current)
- Initial sandbox mode implementation
- Mode selection interface
- Basic sandbox controls UI
- Core utility framework
- Documentation and styling

---

*For questions or support, please open an issue on GitHub or join the Discord community.*
