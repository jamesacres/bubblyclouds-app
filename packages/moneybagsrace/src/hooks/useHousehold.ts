'use client';
import { useContext } from 'react';
import {
  MoneyBagsDataContext,
  MoneyBagsDataContextValue,
} from '../providers/MoneyBagsDataProvider';

export function useHousehold(): MoneyBagsDataContextValue {
  const context = useContext(MoneyBagsDataContext);
  if (!context) {
    throw new Error('useHousehold must be used within a MoneyBagsDataProvider');
  }
  return context;
}
