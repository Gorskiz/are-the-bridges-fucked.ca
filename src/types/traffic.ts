/**
 * Traffic data types for Halifax Harbour Bridges
 */

export type TrafficLevel = 'light' | 'moderate' | 'heavy' | 'closed' | 'unknown';

export interface BridgeDirection {
  direction: 'Halifax Bound' | 'Dartmouth Bound';
  level: TrafficLevel;
  cameraUrl: string;
}

export interface Bridge {
  name: 'Macdonald' | 'MacKay';
  halifaxBound: BridgeDirection;
  dartmouthBound: BridgeDirection;
}

export interface TrafficData {
  macdonald: Bridge;
  mackay: Bridge;
  lastUpdated: Date;
  isFucked: boolean;
  fuckLevel: 'not' | 'kinda' | 'very' | 'absolutely';
}

export interface TrafficApiResponse {
  success: boolean;
  data?: TrafficData;
  error?: string;
}
