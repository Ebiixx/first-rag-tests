import React, { useState, useEffect } from 'react';
import { 
  addKnowledge, 
  getAllKnowledge, 
  updateKnowledge, 
  deleteKnowledge 
} from '../services/ragService';
import './KnowledgeManager.css';

function KnowledgeManager({ onSuccess }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // Load all knowledge items
  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = () => {
    setKnowledgeBase(getAllKnowledge());
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      if (editingId) {
        // Update existing knowledge
        updateKnowledge(editingId, content, tagArray);
        setMessageType('success');
        setMessage(`Knowledge item updated (ID: ${editingId})`);
      } else {
        // Add new knowledge
        const id = addKnowledge(content, tagArray);
        setMessageType('success');
        setMessage(`Knowledge added successfully (ID: ${id})`);
      }
      
      // Reset form
      setContent('');
      setTags('');
      setEditingId(null);
      
      // Refresh knowledge base
      loadKnowledgeBase();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`Error: ${error.message}`);
      console.error('Knowledge operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (doc) => {
    setEditingId(doc.id);
    setContent(doc.content);
    setTags(doc.tags.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    
    try {
      deleteKnowledge(id);
      setShowConfirmDelete(null);
      loadKnowledgeBase();
      setMessageType('success');
      setMessage(`Knowledge item deleted (ID: ${id})`);
    } catch (error) {
      setMessageType('error');
      setMessage(`Error deleting knowledge: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setContent('');
    setTags('');
  };

  return (
    <div className="knowledge-manager">
      <div className="knowledge-form-container">
        <div className="knowledge-header">
          <h3>{editingId ? 'Edit Knowledge' : 'Add New Knowledge'}</h3>
          {editingId && (
            <span className="editing-id">Editing ID: {editingId}</span>
          )}
        </div>
        
        <form onSubmit={handleAddOrUpdate} className="knowledge-form">
          <div className="form-group">
            <label htmlFor="content">Knowledge Content:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Enter knowledge content here..."
              rows={4}
              className="content-textarea"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated):</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
              className="tags-input"
            />
            <small>Optional tags help with search (will be automatically supplemented)</small>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading || !content.trim()} 
              className="primary-button"
            >
              {isLoading 
                ? 'Processing...' 
                : editingId 
                  ? 'Update Knowledge' 
                  : 'Add Knowledge'
              }
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="secondary-button"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>

      <div className="knowledge-list-container">
        <h3>Knowledge Base ({knowledgeBase.length} items)</h3>
        {knowledgeBase.length === 0 ? (
          <p className="no-items">No knowledge items available</p>
        ) : (
          <ul className="knowledge-list">
            {knowledgeBase.map(doc => (
              <li key={doc.id} className="knowledge-item">
                <div className="knowledge-content">
                  <span className="knowledge-id">ID: {doc.id}</span>
                  <p className="knowledge-text">{doc.content}</p>
                  <div className="knowledge-tags">
                    {doc.tags.map((tag, index) => (
                      <span key={index} className="knowledge-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="knowledge-actions">
                  <button 
                    onClick={() => handleEdit(doc)} 
                    className="edit-button"
                    title="Edit this knowledge item"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setShowConfirmDelete(doc.id)} 
                    className="delete-button"
                    title="Delete this knowledge item"
                  >
                    Delete
                  </button>
                  
                  {showConfirmDelete === doc.id && (
                    <div className="confirm-delete">
                      <p>Are you sure you want to delete this item?</p>
                      <div className="confirm-actions">
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="confirm-button"
                        >
                          Yes, delete
                        </button>
                        <button 
                          onClick={() => setShowConfirmDelete(null)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default KnowledgeManager;