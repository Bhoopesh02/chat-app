import React, { useState } from 'react';
import '../styles/poll.css';
import ViewVotesModal from './ViewVotesModal';
import { Check, CheckCheck } from 'lucide-react';
import { getAvatarFallback } from '../utils/stringUtils';

const PollMessage = ({ msg, currentUser, allUsers, onVote }) => {
  const [isViewVotesOpen, setIsViewVotesOpen] = useState(false);

  if (!msg.pollData) return null;

  const { question, options, allowMultiple } = msg.pollData;

  // Calculate total votes across all options
  let totalVotes = 0;
  options.forEach(opt => {
    if (opt.votes) {
      totalVotes += Object.keys(opt.votes).length;
    }
  });

  const handleOptionClick = (optionId) => {
    if (onVote) {
      onVote(msg.id, optionId, allowMultiple);
    }
  };

  const getUserAvatar = (uid) => {
    const user = allUsers.find(u => u.id === uid);
    if (user && user.avatar) return user.avatar;
    return getAvatarFallback(user ? user.name : 'User', 'user');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="poll-message-container">
        <div className="poll-question">{question}</div>
        
        <div className="poll-subtitle">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="8" cy="12" r="6.5" fill="currentColor" />
            <polyline points="5.5 12 7.5 14 10.5 10" fill="none" stroke="#d8f8d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15" cy="12" r="6.5" fill="currentColor" stroke="#d8f8d8" strokeWidth="1.5" />
            <polyline points="12.5 12 14.5 14 17.5 10" fill="none" stroke="#d8f8d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {allowMultiple ? 'Select one or more' : 'Select one'}
        </div>

        <div className="poll-options-list">
          {options.map((opt) => {
            const voters = opt.votes ? Object.keys(opt.votes) : [];
            const voteCount = voters.length;
            const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
            
            // Check if current user voted for this option
            const hasVoted = opt.votes && opt.votes[currentUser.uid];

            // Sort voters by timestamp to get the most recent
            const sortedVoters = [...voters].sort((a, b) => opt.votes[b] - opt.votes[a]);

            return (
              <div 
                key={opt.id} 
                className="poll-option-row"
                onClick={() => handleOptionClick(opt.id)}
              >
                <div className="poll-option-main">
                  <div className="poll-option-left">
                    <div className={`poll-checkbox ${hasVoted ? 'selected' : ''}`}>
                      {hasVoted && (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="poll-option-text">{opt.text}</div>
                  </div>
                  <div className="poll-option-right">
                    {voteCount > 0 && (
                      <div className="poll-voter-avatars">
                        {sortedVoters.slice(0, 3).map(uid => (
                          <img key={uid} className="poll-voter-avatar" src={getUserAvatar(uid)} alt="" />
                        ))}
                      </div>
                    )}
                    <div className="poll-vote-count">{voteCount}</div>
                  </div>
                </div>
                
                <div className={`poll-progress-track ${hasVoted ? 'has-voted' : ''}`}>
                  {voteCount > 0 && (
                    <div className="poll-progress-fill" style={{ width: `${percentage}%` }}></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="poll-footer">
          <div className="poll-timestamp">
            {formatTime(msg.createdAt)} 
            {msg.senderId === currentUser.uid && (
              msg.status === 'read' ? <CheckCheck size={14} color="#3b82f6" /> :
              msg.status === 'delivered' ? <CheckCheck size={14} /> :
              <Check size={14} />
            )}
          </div>
          {totalVotes > 0 && (
            <button 
              className="view-votes-btn"
              onClick={() => setIsViewVotesOpen(true)}
            >
              View votes
            </button>
          )}
        </div>
      </div>

      {isViewVotesOpen && (
        <ViewVotesModal 
          pollData={msg.pollData} 
          allUsers={allUsers}
          onClose={() => setIsViewVotesOpen(false)}
        />
      )}
    </>
  );
};

export default PollMessage;
