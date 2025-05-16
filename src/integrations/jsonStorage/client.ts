
// This file implements a client for storing data in localStorage as JSON
import { v4 as uuidv4 } from 'uuid';

// Types for our JSON storage system
export interface User {
  id: string;
  wallet_address: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: 'pdf' | 'video';
  nft_collection_address: string;
  storage_path: string;
  views: number;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAccessLog {
  id: string;
  content_id: string;
  user_id: string | null;
  wallet_address: string;
  accessed_at: string;
}

// Session management
interface Session {
  user: User | null;
}

// Auth state
interface AuthState {
  user: User | null;
  session: Session | null;
}

class JsonStorageClient {
  private authState: AuthState;
  private listeners: ((event: string, session: Session | null) => void)[] = [];

  constructor() {
    // Initialize storage if needed
    if (!localStorage.getItem('json_users')) {
      localStorage.setItem('json_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('json_profiles')) {
      localStorage.setItem('json_profiles', JSON.stringify([]));
    }
    if (!localStorage.getItem('json_content')) {
      localStorage.setItem('json_content', JSON.stringify([]));
    }
    if (!localStorage.getItem('json_content_access_logs')) {
      localStorage.setItem('json_content_access_logs', JSON.stringify([]));
    }

    // Initialize auth state
    this.authState = {
      user: null,
      session: null
    };

    // Try to restore session from localStorage
    const storedSession = localStorage.getItem('json_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        this.authState = parsedSession;
      } catch (e) {
        console.error('Error parsing stored session:', e);
      }
    }
  }

  // Auth methods
  auth = {
    getUser: async () => {
      return { data: { user: this.authState.user } };
    },

    getSession: async () => {
      return { data: { session: this.authState.session } };
    },

    signOut: async () => {
      this.authState = { user: null, session: null };
      localStorage.removeItem('json_session');
      this.notifyListeners('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      this.listeners.push(callback);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              this.listeners = this.listeners.filter(listener => listener !== callback);
            } 
          } 
        } 
      };
    },

    // Authenticate with a wallet address
    authenticateWithWallet: async (walletAddress: string) => {
      // Check if user exists
      const users = JSON.parse(localStorage.getItem('json_users') || '[]') as User[];
      let user = users.find(u => u.wallet_address === walletAddress);

      if (!user) {
        // Create new user
        user = {
          id: uuidv4(),
          wallet_address: walletAddress,
          created_at: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('json_users', JSON.stringify(users));

        // Create profile for the user
        const profiles = JSON.parse(localStorage.getItem('json_profiles') || '[]') as Profile[];
        const profile = {
          id: user.id,
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        profiles.push(profile);
        localStorage.setItem('json_profiles', JSON.stringify(profiles));
      }

      // Create session
      const session = { user };
      this.authState = {
        user,
        session
      };

      // Store session
      localStorage.setItem('json_session', JSON.stringify(this.authState));
      
      // Notify listeners
      this.notifyListeners('SIGNED_IN', session);

      return { data: { user }, error: null };
    }
  };

  // Database methods
  from = (table: string) => {
    return {
      select: (columns: string = '*') => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: async () => {
                const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
                const item = items.find((i: any) => i[column] === value);
                return { data: item || null, error: item ? null : new Error('Not found') };
              },
              limit: (limit: number) => {
                return {
                  async then(callback: (result: { data: any[]; error: Error | null }) => void) {
                    const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
                    const filteredItems = items
                      .filter((i: any) => i[column] === value)
                      .slice(0, limit);
                    callback({ data: filteredItems, error: null });
                  }
                };
              }
            };
          },
          order: (column: string, { ascending }: { ascending: boolean }) => {
            return {
              async then(callback: (result: { data: any[]; error: Error | null }) => void) {
                const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
                const sortedItems = [...items].sort((a, b) => {
                  if (ascending) {
                    return a[column] < b[column] ? -1 : 1;
                  } else {
                    return a[column] > b[column] ? -1 : 1;
                  }
                });
                callback({ data: sortedItems, error: null });
              }
            };
          },
          async then(callback: (result: { data: any[]; error: Error | null }) => void) {
            const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
            callback({ data: items, error: null });
          }
        };
      },
      insert: (items: any[]) => {
        return {
          select: async () => {
            const existingItems = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
            const newItems = items.map(item => ({
              ...item,
              id: item.id || uuidv4(),
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            }));
            
            const updatedItems = [...existingItems, ...newItems];
            localStorage.setItem(`json_${table}`, JSON.stringify(updatedItems));
            
            return { data: newItems, error: null };
          },
          single: async () => {
            const existingItems = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
            const newItem = {
              ...items[0],
              id: items[0].id || uuidv4(),
              created_at: items[0].created_at || new Date().toISOString(),
              updated_at: items[0].updated_at || new Date().toISOString()
            };
            
            const updatedItems = [...existingItems, newItem];
            localStorage.setItem(`json_${table}`, JSON.stringify(updatedItems));
            
            return { data: newItem, error: null };
          }
        };
      },
      update: (updateData: any) => {
        return {
          eq: (column: string, value: any) => {
            return {
              async then(callback: (result: { error: Error | null }) => void) {
                const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
                const updatedItems = items.map((item: any) => {
                  if (item[column] === value) {
                    return { 
                      ...item, 
                      ...updateData, 
                      updated_at: new Date().toISOString() 
                    };
                  }
                  return item;
                });
                localStorage.setItem(`json_${table}`, JSON.stringify(updatedItems));
                callback({ error: null });
              }
            };
          }
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            return {
              async then(callback: (result: { error: Error | null }) => void) {
                const items = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
                const filteredItems = items.filter((item: any) => item[column] !== value);
                localStorage.setItem(`json_${table}`, JSON.stringify(filteredItems));
                callback({ error: null });
              }
            };
          }
        };
      },
      upsert: (items: any[]) => {
        return {
          async then(callback: (result: { error: Error | null }) => void) {
            const existingItems = JSON.parse(localStorage.getItem(`json_${table}`) || '[]');
            
            const updatedItems = [...existingItems];
            
            for (const item of items) {
              const index = updatedItems.findIndex((i: any) => i.id === item.id);
              
              if (index >= 0) {
                // Update existing item
                updatedItems[index] = { 
                  ...updatedItems[index], 
                  ...item, 
                  updated_at: new Date().toISOString() 
                };
              } else {
                // Insert new item
                updatedItems.push({
                  ...item,
                  id: item.id || uuidv4(),
                  created_at: item.created_at || new Date().toISOString(),
                  updated_at: item.updated_at || new Date().toISOString()
                });
              }
            }
            
            localStorage.setItem(`json_${table}`, JSON.stringify(updatedItems));
            callback({ error: null });
          }
        };
      }
    };
  };

  // Storage methods
  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          return new Promise<{ error: Error | null }>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const dataUrl = reader.result as string;
              
              const storage = JSON.parse(localStorage.getItem(`json_storage_${bucket}`) || '{}');
              storage[path] = {
                data: dataUrl,
                contentType: file.type,
                size: file.size,
                createdAt: new Date().toISOString()
              };
              
              localStorage.setItem(`json_storage_${bucket}`, JSON.stringify(storage));
              resolve({ error: null });
            };
            
            reader.onerror = () => {
              resolve({ error: new Error('Failed to read file') });
            };
          });
        },
        remove: async (paths: string[]) => {
          const storage = JSON.parse(localStorage.getItem(`json_storage_${bucket}`) || '{}');
          
          for (const path of paths) {
            delete storage[path];
          }
          
          localStorage.setItem(`json_storage_${bucket}`, JSON.stringify(storage));
          return { error: null };
        },
        createSignedUrl: async (path: string, expiryInSeconds: number) => {
          const storage = JSON.parse(localStorage.getItem(`json_storage_${bucket}`) || '{}');
          const file = storage[path];
          
          if (!file) {
            return { data: null, error: new Error('File not found') };
          }
          
          // For JSON storage we just return the data URL directly
          return { data: { signedUrl: file.data }, error: null };
        }
      };
    }
  };

  // RPC methods (for custom functions)
  rpc = (functionName: string, params: any) => {
    // Handle increment_content_views function
    if (functionName === 'increment_content_views') {
      const { content_id } = params;
      const contentItems = JSON.parse(localStorage.getItem('json_content') || '[]') as ContentItem[];
      
      const updatedContent = contentItems.map(item => {
        if (item.id === content_id) {
          return { ...item, views: (item.views || 0) + 1 };
        }
        return item;
      });
      
      localStorage.setItem('json_content', JSON.stringify(updatedContent));
      return { error: null };
    }
    
    return { error: new Error(`Function ${functionName} not implemented`) };
  };

  // Helper method to notify auth state change listeners
  private notifyListeners(event: string, session: Session | null) {
    for (const listener of this.listeners) {
      listener(event, session);
    }
  }
}

export const jsonStorageClient = new JsonStorageClient();
