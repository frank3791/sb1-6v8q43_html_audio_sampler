import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Sample {
  id: string;
  name: string;
  url: string;
  data?: string;
}

interface Tab {
  id: string;
  name: string;
  samples: Sample[];
}

interface SamplerStore {
  tabs: Tab[];
  activeTabId: string;
  volume: number;
  currentAudio: HTMLAudioElement | null;
  setVolume: (volume: number) => void;
  addTab: (name: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateSample: (tabId: string, sampleId: string, file: File) => void;
  updateTabName: (tabId: string, name: string) => void;
  stopCurrentAudio: () => void;
  playAudio: (sample: Sample) => void;
}

const MAX_STORAGE_SIZE = 25 * 1024 * 1024; // 25MB safety limit

const createCustomStorage = () => {
  const storage = createJSONStorage(() => localStorage);
  
  const compressAudioData = (data: string): string => {
    if (data.startsWith('data:audio')) {
      return data.split(',')[1];
    }
    return data;
  };

  const decompressAudioData = (data: string): string => {
    if (!data.startsWith('data:')) {
      return `data:audio/mpeg;base64,${data}`;
    }
    return data;
  };

  const calculateStorageSize = (data: any): number => {
    return new Blob([JSON.stringify(data)]).size;
  };

  const trimStorageToFit = (data: any): any => {
    while (calculateStorageSize(data) > MAX_STORAGE_SIZE && data.state?.tabs?.length > 1) {
      data.state.tabs.shift(); // Remove oldest tab
    }
    return data;
  };

  return {
    ...storage,
    getItem: (name: string) => {
      try {
        const value = storage.getItem(name);
        if (!value) return null;

        const data = JSON.parse(value);
        if (data.state?.tabs) {
          data.state.tabs = data.state.tabs.map((tab: Tab) => ({
            ...tab,
            samples: tab.samples.map((sample: Sample) => ({
              ...sample,
              data: sample.data ? decompressAudioData(sample.data) : undefined,
            })),
          }));
        }
        return data;
      } catch (error) {
        console.warn('Error reading from storage, returning initial state');
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        let data = JSON.parse(value);
        
        if (data.state?.tabs) {
          // Compress audio data
          data.state.tabs = data.state.tabs.map((tab: Tab) => ({
            ...tab,
            samples: tab.samples.map((sample: Sample) => ({
              ...sample,
              data: sample.data ? compressAudioData(sample.data) : undefined,
            })),
          }));

          // Ensure data fits in storage
          data = trimStorageToFit(data);
        }

        const compressedValue = JSON.stringify(data);
        
        try {
          storage.setItem(name, compressedValue);
        } catch (storageError) {
          // Clear storage and try again with only the active tab
          if (data.state?.tabs?.length > 0) {
            const activeTabId = data.state.activeTabId;
            data.state.tabs = data.state.tabs.filter((tab: Tab) => tab.id === activeTabId);
            const reducedValue = JSON.stringify(data);
            localStorage.clear();
            storage.setItem(name, reducedValue);
          }
        }
      } catch (error) {
        // Log error but don't throw to prevent app crashes
        console.warn('Storage operation failed:', error);
      }
    },
  };
};

const defaultSamples = Array(12).fill(null).map((_, i) => ({
  id: `sample-${i}`,
  name: `Sample ${i + 1}`,
  url: '',
  data: ''
}));

const initialTabs: Tab[] = [
  {
    id: 'tab-1',
    name: 'Bank 1',
    samples: [...defaultSamples]
  }
];

let audioContext: AudioContext | null = null;

export const useSamplerStore = create<SamplerStore>()(
  persist(
    (set, get) => ({
      tabs: initialTabs,
      activeTabId: initialTabs[0].id,
      volume: 1,
      currentAudio: null,

      setVolume: (volume) => {
        set({ volume });
        const { currentAudio } = get();
        if (currentAudio) {
          currentAudio.volume = volume;
        }
      },

      addTab: (name) => {
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          name,
          samples: [...defaultSamples]
        };
        set((state) => ({ tabs: [...state.tabs, newTab] }));
      },

      removeTab: (id) => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) {
          alert('Cannot remove the last tab');
          return;
        }
        set((state) => ({
          tabs: state.tabs.filter((tab) => tab.id !== id),
          activeTabId: state.activeTabId === id ? state.tabs[0].id : state.activeTabId
        }));
      },

      setActiveTab: (id) => {
        set({ activeTabId: id });
      },

      updateTabName: (tabId, name) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, name } : tab
          )
        }));
      },

      updateSample: async (tabId, sampleId, file) => {
        if (file.size > 30 * 1024 * 1024) {
          alert('File size must be under 30MB');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const data = reader.result as string;
          set((state) => ({
            tabs: state.tabs.map((tab) => {
              if (tab.id === tabId) {
                return {
                  ...tab,
                  samples: tab.samples.map((sample) => {
                    if (sample.id === sampleId) {
                      return {
                        ...sample,
                        name: file.name,
                        data,
                        url: URL.createObjectURL(file)
                      };
                    }
                    return sample;
                  })
                };
              }
              return tab;
            })
          }));
        };
      },

      stopCurrentAudio: () => {
        const { currentAudio } = get();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          URL.revokeObjectURL(currentAudio.src);
        }
        set({ currentAudio: null });
      },

      playAudio: (sample) => {
        if (!sample.data) return;

        const { stopCurrentAudio, volume } = get();
        stopCurrentAudio();

        try {
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          const audio = new Audio(sample.data);
          audio.volume = volume;

          // Ensure audio is fully loaded before playing
          audio.addEventListener('canplaythrough', () => {
            const playPromise = audio.play();
            if (playPromise) {
              playPromise.catch((error) => {
                if (error.name !== 'AbortError') {
                  console.warn('Audio playback failed:', error);
                }
              });
            }
          }, { once: true });

          set({ currentAudio: audio });
        } catch (error) {
          console.warn('Audio initialization failed:', error);
        }
      }
    }),
    {
      name: 'sampler-storage',
      storage: createCustomStorage(),
      partialize: (state) => ({
        tabs: state.tabs,
        volume: state.volume
      })
    }
  )
);