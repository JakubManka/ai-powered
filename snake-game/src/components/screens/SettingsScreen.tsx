// ==========================================
// SettingsScreen Component - Game settings and accessibility
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Toggle, ColorPicker } from '@/components/ui';
import type { PlayerSettings } from '@/types';

export interface SettingsScreenProps {
  settings: PlayerSettings;
  onSave: (settings: PlayerSettings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
  const [localSettings, setLocalSettings] = useState<PlayerSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const updateSetting = <K extends keyof PlayerSettings>(
    key: K,
    value: PlayerSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setShowSaved(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-slide-in">
      {/* Title */}
      <h1 className="font-pixel text-xl text-gb-darkest text-shadow-gb">
        SETTINGS
      </h1>

      {/* Settings Cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Sound Settings */}
        <Card title="Audio">
          <Toggle
            checked={localSettings.soundEnabled}
            onChange={(checked) => updateSetting('soundEnabled', checked)}
            label="Sound Effects"
          />
        </Card>

        {/* Accessibility Settings */}
        <Card title="Accessibility">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={localSettings.highContrastMode}
              onChange={(checked) => updateSetting('highContrastMode', checked)}
              label="High Contrast Mode"
            />

            {localSettings.highContrastMode && (
              <div className="flex flex-col gap-4 pt-4 border-t-2 border-gb-dark">
                <ColorPicker
                  label="Foreground Color"
                  value={localSettings.foregroundColor}
                  onChange={(color) => updateSetting('foregroundColor', color)}
                />

                <ColorPicker
                  label="Background Color"
                  value={localSettings.backgroundColor}
                  onChange={(color) => updateSetting('backgroundColor', color)}
                />

                {/* Preview */}
                <div className="mt-2">
                  <p className="font-pixel text-[10px] text-gb-dark uppercase mb-2">
                    Preview
                  </p>
                  <div
                    className="w-full h-20 border-2 border-gb-darkest flex items-center justify-center"
                    style={{ backgroundColor: localSettings.backgroundColor }}
                  >
                    <div
                      className="w-8 h-8"
                      style={{ backgroundColor: localSettings.foregroundColor }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Save Confirmation */}
      {showSaved && (
        <div className="font-pixel text-[10px] text-gb-darkest bg-gb-light px-4 py-2 border-2 border-gb-dark">
          Settings saved!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <Button onClick={handleSave}>
          Save Settings
        </Button>

        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

