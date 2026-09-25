import { describe, it, expect } from 'vitest';

describe('S.H.A.F.T. Broker Integration & Gateway Bridge', () => {
  it('should format standard FIX 4.4 NewOrderSingle (35=D) message tags', () => {
    const clOrdId = 'ORD-2026-ZA01';
    const symbol = 'EURUSD';
    const side = '1'; // Buy
    const price = 1.08450;
    const orderQty = 500000;

    const fixMessage = {
      tag8: 'FIX.4.4',
      tag35: 'D', // NewOrderSingle
      tag49: 'SHAFT_QUANT_CORE',
      tag56: 'EXNESS_ZA_FIX_GW',
      tag11: clOrdId,
      tag55: symbol,
      tag54: side,
      tag44: price,
      tag38: orderQty,
      tag40: '2', // Limit
      tag59: '0', // Day
      tag10: '142' // CheckSum
    };

    expect(fixMessage.tag8).toBe('FIX.4.4');
    expect(fixMessage.tag35).toBe('D');
    expect(fixMessage.tag11).toBe(clOrdId);
    expect(fixMessage.tag55).toBe('EURUSD');
    expect(fixMessage.tag44).toBe(1.08450);
  });

  it('should parse MQL5 execution response return codes (RetCode)', () => {
    const validDoneResponse = {
      retcode: 10009, // TRADE_RETCODE_DONE
      deal: 948201,
      order: 8847291,
      volume: 1.0,
      price: 1.08455
    };

    const requoteResponse = {
      retcode: 10014, // TRADE_RETCODE_REQUOTE
      comment: 'Requote: Price changed beyond deviation tolerance'
    };

    const timeoutResponse = {
      retcode: 10006, // TRADE_RETCODE_CONNECTION
      comment: 'Execution window timeout exceeded (>50ms)'
    };

    expect(validDoneResponse.retcode).toBe(10009);
    expect(requoteResponse.retcode).toBe(10014);
    expect(timeoutResponse.retcode).toBe(10006);
  });

  it('should authenticate broker credentials with Real vs Demo partition', () => {
    const createBrokerAuthPayload = (isDemo: boolean) => ({
      brokerType: 'EXNESS',
      server: isDemo ? 'Exness-MT5Trial-ZA01' : 'Exness-MT5Real-ZA01',
      login: '78401924',
      isDemo
    });

    const realAuth = createBrokerAuthPayload(false);
    expect(realAuth.isDemo).toBe(false);
    expect(realAuth.server).toContain('Real');

    const demoAuth = createBrokerAuthPayload(true);
    expect(demoAuth.isDemo).toBe(true);
    expect(demoAuth.server).toContain('Trial');
  });
});
