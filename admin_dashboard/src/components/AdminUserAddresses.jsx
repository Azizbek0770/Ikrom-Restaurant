import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAddressesAPI } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const AddressForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState(initial || { street_address: '', latitude: '', longitude: '', delivery_instructions: '', is_default: false });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <Input label="Street address" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} required />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <Input label="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
      </div>
      <Input label="Description" value={form.delivery_instructions} onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })} required />
      <label className="flex items-center space-x-2"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> <span>Set as default</span></label>
      <div className="flex justify-end space-x-2"><Button onClick={onCancel} variant="secondary">Cancel</Button><Button type="submit">Save</Button></div>
    </form>
  );
};

const AdminUserAddresses = ({ userId, open, onClose }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId, 'addresses'],
    queryFn: async () => {
      const r = await adminAddressesAPI.getAll(userId);
      return r.data.data.addresses;
    },
    enabled: !!open
  });
  const createMut = useMutation((payload) => adminAddressesAPI.create(userId, payload), { onSuccess: () => { queryClient.invalidateQueries(['admin', 'user', userId, 'addresses']); toast.success('Address created'); } });
  const updateMut = useMutation(({ id, payload }) => adminAddressesAPI.update(userId, id, payload), { onSuccess: () => { queryClient.invalidateQueries(['admin', 'user', userId, 'addresses']); toast.success('Address updated'); } });
  const deleteMut = useMutation((id) => adminAddressesAPI.delete(userId, id), { onSuccess: () => { queryClient.invalidateQueries(['admin', 'user', userId, 'addresses']); toast.success('Address deleted'); } });

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <Modal isOpen={open} onClose={onClose} title={`Addresses for user ${userId}`}>
      <div className="space-y-4">
        <div className="flex justify-end"><Button onClick={() => { setEditing(null); setShowForm(true); }}>Add Address</Button></div>
        {isLoading ? <div>Loading...</div> : (
          <div className="space-y-3">
            {(data || []).map(a => (
              <div key={a.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.label || a.street_address}</div>
                  <div className="text-sm text-gray-600">{a.street_address}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={() => { setEditing(a); setShowForm(true); }}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteMut.mutate(a.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="mt-4">
            <AddressForm initial={editing} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={(payload) => {
              if (editing) updateMut.mutate({ id: editing.id, payload }); else createMut.mutate(payload);
              setShowForm(false); setEditing(null);
            }} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminUserAddresses;


