// __mocks__/expo-secure-store.ts
export const getItemAsync = jest.fn(async (key: string) => null);
export const setItemAsync = jest.fn(async (key: string, value: string) => {});
export const deleteItemAsync = jest.fn(async (key: string) => {});
