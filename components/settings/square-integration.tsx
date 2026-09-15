import useSquareConnection from '@/hooks/use-square-connection';
import { SquareFieldKey, SquareIntegrationState, SquareMode } from '@/lib/types';
import { CircleCheckBig } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import CardStatus from '../card-status';
import { Button } from '../ui/button';
import { TabsContent } from '../ui/tabs';
import { LocalInput, LocalSwitch } from './button-and-switch';

const SquareIntegration = ({
  squareIntegration,
  setSquareIntegration,
}: {
  squareIntegration: SquareIntegrationState;
  setSquareIntegration: (val: any) => void;
}) => {
  const activeMode: SquareMode = squareIntegration.mode;
  const squareFields: {
    key: SquareFieldKey;
    title: string;
    placeholder: string;
  }[] = [
    {
      key: 'merchantId',
      title: 'Merchant ID',
      placeholder: 'MLSQ12345678',
    },
    {
      key: 'locationId',
      title: 'Location ID',
      placeholder: 'L12345689',
    },
    {
      key: 'apiKey',
      title: 'API Key',
      placeholder: '**********',
    },
  ];

  const { loading, connected, checkConnection } = useSquareConnection(
    squareIntegration.mode,
    squareIntegration
  );

  const validateConnection = useMemo(() => {
    const credentials = squareIntegration.credentials[activeMode];

    return squareFields.every((field) => {
      const value = credentials?.[field.key];

      return typeof value === 'string' && value.trim() !== '';
    });
  }, [squareIntegration, activeMode]);

  return (
    <TabsContent value="Square Integration" className="space-y-4">
      <div className=" flex justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-[18px] font normal">Square Integration</h1>
          <p className="text-xs text-muted-foreground">
            Manage your Square payment integration settings.
          </p>
        </div>
        <div>
          <CardStatus
            value={connected ? 'connected' : 'disconnected'}
            icon={true}
            className="gap-0"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {squareFields.map((field) => (
          <LocalInput
            key={field.key}
            title={field.title}
            placeholder={field.placeholder}
            value={squareIntegration.credentials[activeMode][field.key]}
            onChange={(val) => {
              setSquareIntegration((prev: any) => ({
                ...prev,
                credentials: {
                  ...prev.credentials,
                  [activeMode]: {
                    ...prev.credentials[activeMode],
                    [field.key]: val,
                  },
                },
              }));
            }}
          />
        ))}
        <LocalSwitch
          title="Test Mode"
          description="Use Square sandbox for testing"
          value={squareIntegration.mode === 'test'}
          onChange={(val) => {
            setSquareIntegration((prev: any) => ({
              ...prev,
              mode: val ? 'test' : 'live',
            }));
          }}
        />
      </div>
      <div className="space-x-4 mt-8">
        <Button
          disabled={!validateConnection}
          onClick={() => {
            checkConnection();
          }}
          variant={'outline'}
          className="leading-none"
        >
          <CircleCheckBig /> {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
    </TabsContent>
  );
};

export default memo(SquareIntegration);
