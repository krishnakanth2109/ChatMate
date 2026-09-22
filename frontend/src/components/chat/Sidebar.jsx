// src/components/chat/Sidebar.jsx
import React from 'react';
import ContactList from './ContactList';
import Discover from './Discover';
import Invites from './Invites';
// import GroupList from './GroupList'; // You would create this component next

const Sidebar = ({ onSelectUser, selectedUserId, forceUpdate, onInviteAccepted, pendingInvitesCount, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'contacts', label: 'Contacts' },
    { id: 'groups', label: 'Groups' },
    { id: 'discover', label: 'Discover' },
    { id: 'invites', label: 'Invites' },
  ];

  return (
    <aside className="w-full h-full bg-slate-800 text-white flex flex-col">
      <div className="p-2 border-b border-slate-700">
        <nav className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors relative ${
                activeTab === tab.id ? 'bg-blue-600' : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              {tab.label}
              {tab.id === 'invites' && pendingInvitesCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-red-500 text-xs flex items-center justify-center ring-2 ring-slate-800">
                  {pendingInvitesCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1">
        {activeTab === 'contacts' && <ContactList onSelectUser={onSelectUser} selectedUserId={selectedUserId} forceUpdate={forceUpdate} />}
        {/* Placeholder for GroupList - you would build this next */}
        {activeTab === 'groups' && <div className="p-4 text-slate-400">Group chat feature coming soon!</div>}
        {activeTab === 'discover' && <Discover />}
        {activeTab === 'invites' && <Invites onInviteAccepted={onInviteAccepted} />}
      </div>
    </aside>
  );
};

export default Sidebar;