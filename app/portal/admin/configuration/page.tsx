'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { ReactNode, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { FaFloppyDisk } from 'react-icons/fa6';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Configuration {
  id: number;
  session_types: string[];
  position_list: string[];
  skill_level_list: string[];
  comped_category_list: string[];
}

export default function Page() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await axios.get('/admin/configuration');
      setConfig(res.data[0]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaveLoading(true);
    try {
      await axios.put('/admin/configuration', config);
      toast.success('Configuration updated');
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading)
    return (
      <div className="w-full flex justify-center pt-10">
        <Spinner />
      </div>
    );

  return (
    <div className="flex flex-col w-full gap-6">
      <Header>
        <Button disabled={saveLoading || !config} onClick={handleSave}>
          <FaFloppyDisk />
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Header>

      {config && (
        <>
          <ArrayEditor
            title="Session Types"
            values={config.session_types}
            onChange={(arr) => setConfig({ ...config, session_types: arr })}
          />

          <ArrayEditor
            title="Position List"
            values={config.position_list}
            onChange={(arr) => setConfig({ ...config, position_list: arr })}
          />

          <ArrayEditor
            title="Skill Levels"
            values={config.skill_level_list}
            onChange={(arr) => setConfig({ ...config, skill_level_list: arr })}
          />

          <ArrayEditor
            title="Comped Categories"
            values={config.comped_category_list}
            onChange={(arr) => setConfig({ ...config, comped_category_list: arr })}
          />
        </>
      )}
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full justify-between items-center">
      <p className="text-xl">Configuration</p>
      {children}
    </div>
  );
};

interface ArrayEditorProps {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export function ArrayEditor({ title, values, onChange }: ArrayEditorProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [newValue, setNewValue] = useState('');

  const updateItem = (index: number, value: string) => {
    const updated = [...values];
    updated[index] = value;
    onChange(updated);
  };

  const addItem = () => {
    if (!newValue.trim()) return;
    onChange([...values, newValue.trim()]);
    setNewValue('');
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-[#252525] border border-[#3A3A3A] rounded-xl">
      {/* Header */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2 className="text-lg font-semibold">
          {title} ({values.length})
        </h2>

        {collapsed ? <ChevronDown /> : <ChevronUp />}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* List */}
          <ScrollArea className="h-[250px] pr-3">
            <div className="flex flex-col gap-2">
              {values.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input value={item} onChange={(e) => updateItem(index, e.target.value)} />

                  <Button size="icon" variant="destructive" onClick={() => removeItem(index)}>
                    <Trash size={15} />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Add New */}
          <div className="flex gap-2">
            <Input
              placeholder={`Add new ${title}`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
              }}
            />

            <Button variant="outline" onClick={addItem} disabled={!newValue.trim()}>
              <Plus size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
