import { DemoRepository } from './demo';

// Future: Switch based on import.meta.env.VITE_APP_MODE
// const isProduction = import.meta.env.VITE_APP_MODE === 'production';
// export const repository = isProduction ? SupabaseRepository : DemoRepository;

export const repository = DemoRepository;
