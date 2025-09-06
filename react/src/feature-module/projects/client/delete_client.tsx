import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../SocketContext';
import { Socket } from 'socket.io-client';
import { message } from 'antd';

interface Client {
  _id: string;
  name: string;
  company: string;
  email: string;
}

const DeleteClient = () => {
  const socket = useSocket() as Socket | null;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleDeleteClient = (event: any) => {
      const clientData = event.detail.client;
      console.log('[DeleteClient] Received client data:', clientData);
      setClient({
        _id: clientData._id || '',
        name: clientData.name || '',
        company: clientData.company || '',
        email: clientData.email || ''
      });
    };

    window.addEventListener('delete-client', handleDeleteClient);
    return () => window.removeEventListener('delete-client', handleDeleteClient);
  }, []);

  const handleConfirmDelete = async () => {
    if (!client || !socket) {
      message.error("Socket connection not available");
      return;
    }

    setLoading(true);
    try {
      console.log('Deleting client:', client._id);
      socket.emit('client:delete', { clientId: client._id });

      // Listen for response
      socket.once('client:delete-response', (response: any) => {
        if (response.done) {
          console.log('Client deleted successfully:', response.data);
          message.success('Client deleted successfully!');
          
          // Close modal
          const modal = document.getElementById('delete_client');
          if (modal) {
            const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal);
            if (bootstrapModal) {
              bootstrapModal.hide();
            }
          }
          setClient(null);
        } else {
          console.error('Failed to delete client:', response.error);
          message.error(`Failed to delete client: ${response.error}`);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      message.error('An error occurred while deleting the client');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setClient(null);
    const modal = document.getElementById('delete_client');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
  };

  return (
    <div className="modal fade" id="delete_client">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content">
          <div className="modal-body">
            <div className="text-center p-3">
              <span className="avatar avatar-lg avatar-rounded bg-danger mb-3">
                <i className="ti ti-trash fs-24" />
              </span>
              <h5 className="mb-2">Delete Client</h5>
              <p className="mb-3">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              {client && (
                <div className="bg-light p-3 rounded mb-3">
                  <h6 className="mb-1">{client.name}</h6>
                  <p className="mb-1 text-muted">{client.company}</p>
                  <p className="mb-0 text-muted">{client.email}</p>
                </div>
              )}
              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteClient;