export const userState: { [key: string]: string } = {};

interface BotSetupState {
  tokenAddress: string;
  projectGroup: number;
}

export const botSetupState: { [key: number]: Partial<BotSetupState> } = {};

interface SettingsState {
  projectId: number;
}

export const settingsState: { [key: string]: SettingsState } = {};
