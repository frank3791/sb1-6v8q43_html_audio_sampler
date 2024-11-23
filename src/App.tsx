import React from 'react';
import { Plus, StopCircle } from 'lucide-react';
import { useSamplerStore } from './store/useSamplerStore';
import { SamplePad } from './components/SamplePad';
import { VolumeControl } from './components/VolumeControl';
import { TabButton } from './components/TabButton';

function App() {
  const { tabs, activeTabId, addTab, stopCurrentAudio } = useSamplerStore();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleAddTab = () => {
    const tabNumber = tabs.length + 1;
    addTab(`Bank ${tabNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Music Sampler</h1>
          <div className="flex items-center gap-4">
            <VolumeControl />
            <button
              onClick={stopCurrentAudio}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
            >
              <StopCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              id={tab.id}
              name={tab.name}
              isActive={tab.id === activeTabId}
            />
          ))}
          <button
            onClick={handleAddTab}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {activeTab && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {activeTab.samples.map(sample => (
              <SamplePad
                key={sample.id}
                id={sample.id}
                name={sample.name}
                url={sample.url}
                data={sample.data}
                tabId={activeTab.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;