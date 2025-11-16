import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import PartiesProvider, { PartiesContext } from './PartiesProvider';
import { useServerStorage } from '../hooks/serverStorage';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { Party } from '@sudoku-web/types/serverTypes';

jest.mock('../hooks/serverStorage');

const mockUseServerStorage = useServerStorage as jest.Mock;

const TestConsumer = () => {
  const context = useContext(PartiesContext);
  return <div>{context?.parties.length} parties</div>;
};

describe('PartiesProvider', () => {
  let mockListParties: jest.Mock;
  let mockCreateParty: jest.Mock;

  beforeEach(() => {
    mockListParties = jest.fn().mockResolvedValue([]);
    mockCreateParty = jest.fn();
    mockUseServerStorage.mockReturnValue({
      listParties: mockListParties,
      createParty: mockCreateParty,
      updateParty: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
  });

  const renderWithUser = (user: UserContextInterface['user']) => {
    return render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <TestConsumer />
        </PartiesProvider>
      </UserContext.Provider>
    );
  };

  it('lazy loads parties for a logged-in user', async () => {
    const mockParties: Party[] = [
      {
        partyId: '1',
        appId: 'app-1',
        partyName: 'Test Party',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: true,
        members: [],
      },
    ];
    mockListParties.mockResolvedValue(mockParties);
    const user = { sub: 'user1', name: 'Test' };

    let context: any;
    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.parties.length} parties</div>;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    // Explicitly call lazyLoadParties since it's not called automatically on mount
    await act(async () => {
      await context.lazyLoadParties();
    });

    await waitFor(() => {
      expect(mockListParties).toHaveBeenCalled();
      expect(screen.getByText('1 parties')).toBeInTheDocument();
    });
  });

  it('does not load parties for a logged-out user', () => {
    renderWithUser(undefined);
    expect(mockListParties).not.toHaveBeenCalled();
    expect(screen.getByText('0 parties')).toBeInTheDocument();
  });

  it('allows creating a party', async () => {
    const newParty: Party = {
      partyId: '2',
      appId: 'app-1',
      partyName: 'New Party',
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwner: true,
      members: [],
    };
    mockCreateParty.mockResolvedValue(newParty);
    const user = { sub: 'user1', name: 'Test' };

    let context: any;
    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.saveParty({ partyName: 'New Party', memberNickname: 'Me' });
    });

    expect(mockCreateParty).toHaveBeenCalledWith({
      partyName: 'New Party',
      memberNickname: 'Me',
    });
    expect(context.parties).toContain(newParty);
  });

  it('provides all required context properties', async () => {
    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    expect(context).toHaveProperty('parties');
    expect(context).toHaveProperty('isLoading');
    expect(context).toHaveProperty('showCreateParty');
    expect(context).toHaveProperty('setShowCreateParty');
    expect(context).toHaveProperty('isSaving');
    expect(context).toHaveProperty('memberNickname');
    expect(context).toHaveProperty('setMemberNickname');
    expect(context).toHaveProperty('partyName');
    expect(context).toHaveProperty('setPartyName');
    expect(context).toHaveProperty('saveParty');
    expect(context).toHaveProperty('updateParty');
    expect(context).toHaveProperty('refreshParties');
    expect(context).toHaveProperty('lazyLoadParties');
    expect(context).toHaveProperty('getNicknameByUserId');
    expect(context).toHaveProperty('leaveParty');
    expect(context).toHaveProperty('removeMember');
    expect(context).toHaveProperty('deleteParty');
  });

  it('handles getNicknameByUserId correctly', async () => {
    const mockParties: Party[] = [
      {
        partyId: '1',
        partyName: 'Test Party',
        members: [
          { userId: 'user1', memberNickname: 'Alice' } as any,
          { userId: 'user2', memberNickname: 'Bob' } as any,
        ],
      } as any,
    ];
    mockListParties.mockResolvedValue(mockParties);
    const user = { sub: 'user1', name: 'Test' };

    let context: any;
    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.refreshParties();
    });

    const nickname = context.getNicknameByUserId('user1');
    expect(nickname).toBe('Alice');
  });

  it('handles updateParty method', async () => {
    const mockUpdateParty = jest.fn().mockResolvedValue(true);
    mockUseServerStorage.mockReturnValue({
      listParties: mockListParties,
      createParty: mockCreateParty,
      updateParty: mockUpdateParty,
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.updateParty('party-1', { partyName: 'Updated' });
    });

    expect(mockUpdateParty).toHaveBeenCalledWith('party-1', {
      partyName: 'Updated',
    });
  });

  it('handles leaveParty method', async () => {
    const mockLeaveParty = jest.fn().mockResolvedValue(true);
    mockUseServerStorage.mockReturnValue({
      listParties: mockListParties,
      createParty: mockCreateParty,
      updateParty: jest.fn(),
      leaveParty: mockLeaveParty,
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });

    const mockParties: Party[] = [
      {
        partyId: '1',
        partyName: 'Test Party',
        members: [],
      } as any,
    ];
    mockListParties.mockResolvedValue(mockParties);

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.parties.length}</div>;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.refreshParties();
    });

    await act(async () => {
      await context.leaveParty('1');
    });

    expect(mockLeaveParty).toHaveBeenCalledWith('1');
  });

  it('handles removeMember method', async () => {
    const mockRemoveMember = jest.fn().mockResolvedValue(true);
    mockUseServerStorage.mockReturnValue({
      listParties: mockListParties,
      createParty: mockCreateParty,
      updateParty: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: mockRemoveMember,
      deleteParty: jest.fn(),
    });

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.removeMember('party-1', 'user-2');
    });

    expect(mockRemoveMember).toHaveBeenCalledWith('party-1', 'user-2');
  });

  it('handles deleteParty method', async () => {
    const mockDeleteParty = jest.fn().mockResolvedValue(true);
    mockUseServerStorage.mockReturnValue({
      listParties: mockListParties,
      createParty: mockCreateParty,
      updateParty: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: mockDeleteParty,
    });

    const mockParties: Party[] = [
      {
        partyId: '1',
        partyName: 'Test Party',
        members: [],
      } as any,
    ];
    mockListParties.mockResolvedValue(mockParties);

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.parties.length}</div>;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.refreshParties();
    });

    await act(async () => {
      await context.deleteParty('1');
    });

    expect(mockDeleteParty).toHaveBeenCalledWith('1');
  });

  it('updates member nickname from user context', async () => {
    const user = { sub: 'user1', given_name: 'John' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.memberNickname}</div>;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(context.memberNickname).toBe('John');
    });
  });

  it('handles form state changes', async () => {
    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      context.setShowCreateParty(true);
    });

    expect(context.showCreateParty).toBe(true);

    await act(async () => {
      context.setMemberNickname('TestNickname');
    });

    expect(context.memberNickname).toBe('TestNickname');

    await act(async () => {
      context.setPartyName('TestParty');
    });

    expect(context.partyName).toBe('TestParty');
  });

  it('handles refreshParties with sessionParties refresh', async () => {
    const mockRefreshSessionParties = jest.fn().mockResolvedValue(undefined);
    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.refreshParties(mockRefreshSessionParties);
    });

    expect(mockRefreshSessionParties).toHaveBeenCalled();
  });

  it('clears parties when user changes', async () => {
    const user1 = { sub: 'user1', name: 'User 1' };
    const user2 = { sub: 'user2', name: 'User 2' };

    const mockParties: Party[] = [
      {
        partyId: '1',
        partyName: 'Test Party',
        members: [],
      } as any,
    ];
    mockListParties.mockResolvedValue(mockParties);

    let context: any;
    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.parties.length}</div>;
    };

    const { rerender } = render(
      <UserContext.Provider value={{ user: user1 } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      await context.refreshParties();
    });

    rerender(
      <UserContext.Provider value={{ user: user2 } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    expect(context.parties).toEqual([]);
  });

  it('handles saveParty validation', async () => {
    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    // Try to save without required fields
    const result = await context.saveParty({
      partyName: '',
      memberNickname: '',
    });

    expect(result).toBeUndefined();
    expect(mockCreateParty).not.toHaveBeenCalled();
  });

  it('handles saveParty with valid inputs', async () => {
    const newParty: Party = {
      partyId: '2',
      partyName: 'New Party',
      members: [],
    } as any;
    mockCreateParty.mockResolvedValue(newParty);

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    let result;
    await act(async () => {
      result = await context.saveParty({
        partyName: 'New Party',
        memberNickname: 'Me',
      });
    });

    expect(result).toEqual(newParty);
    expect(context.parties).toContain(newParty);
  });

  it('handles non-logged-in user gracefully', async () => {
    const user = undefined;
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return <div>{context?.parties.length}</div>;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    await act(async () => {
      const result = await context.refreshParties();
      expect(result).toBeUndefined();
    });
  });

  it('returns updated parties from refreshParties', async () => {
    const mockParties: Party[] = [
      {
        partyId: '1',
        partyName: 'Updated Party',
        members: [],
      } as any,
    ];
    mockListParties.mockResolvedValue(mockParties);

    const user = { sub: 'user1', name: 'Test' };
    let context: any;

    const Consumer = () => {
      context = useContext(PartiesContext);
      return null;
    };

    render(
      <UserContext.Provider value={{ user } as any}>
        <PartiesProvider>
          <Consumer />
        </PartiesProvider>
      </UserContext.Provider>
    );

    let result;
    await act(async () => {
      result = await context.refreshParties();
    });

    expect(result).toEqual(mockParties);
  });
});
