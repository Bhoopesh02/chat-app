export const currentUser = {
  id: 'current-user',
  name: 'Bhoopesh',
  email: 'bhoopesh@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhoopesh',
  status: 'online',
};

export const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    status: 'online',
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: 'offline',
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    status: 'online',
  },
  {
    id: '4',
    name: 'David Lee',
    email: 'david@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    status: 'offline',
  },
  {
    id: '5',
    name: 'Emma Watson',
    email: 'emma@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    status: 'online',
  },
];

export const initialConversations = [
  {
    id: 'conversation-1',
    type: 'private',
    participants: ['current-user', '1'],
    messages: [
      {
        id: 'msg-1',
        senderId: '1',
        text: 'Hey Bhoopesh, how are you?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg-2',
        senderId: 'current-user',
        text: 'I am doing well, John! Thanks for asking.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
  },
  {
    id: 'conversation-2',
    type: 'private',
    participants: ['current-user', '2'],
    messages: [
      {
        id: 'msg-3',
        senderId: '2',
        text: 'Did you get the files I sent?',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  },
];

export const initialGroups = [
  {
    id: 'group-1',
    type: 'group',
    name: 'CSE Students',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CSE',
    members: ['current-user', '1', '2', '3', '4'],
    messages: [
      {
        id: 'msg-4',
        senderId: '1',
        text: 'Hello everyone!',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'msg-5',
        senderId: '3',
        text: 'Hey John!',
        timestamp: new Date(Date.now() - 86000000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'group-2',
    type: 'group',
    name: 'Project Team',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PT',
    members: ['current-user', '1', '5'],
    messages: [
      {
        id: 'msg-6',
        senderId: '5',
        text: 'Meeting at 3 PM today.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];
