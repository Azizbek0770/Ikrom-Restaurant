import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AdminUserAddresses from '@/components/AdminUserAddresses';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ImageUpload from '@/components/ui/ImageUpload';
import ImageLightbox from '@/components/ImageLightbox';
import { Plus, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const UserForm = ({ user, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'customer',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
    is_active: user?.is_active ?? true,
    is_verified: user?.is_verified ?? false,
    password: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => (user ? usersAPI.update(user.id, data) : usersAPI.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success(user ? 'User updated' : 'User created');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="First name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
      <Input label="Last name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
      <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      <ImageUpload
        label="Profile Photo"
        value={formData.avatar_url}
        onChange={(url) => setFormData({ ...formData, avatar_url: url })}
        type="avatars"
      />
      <Select
        label="Role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        options={[
          { label: 'Customer', value: 'customer' },
          { label: 'Delivery', value: 'delivery' },
          { label: 'Admin', value: 'admin' },
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={formData.is_verified} onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })} />
          <span className="text-sm text-gray-700">Verified</span>
        </label>
      </div>
      <Input label="Password (leave empty to keep)" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={mutation.isPending}>{user ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
};

const Users = () => {
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addressesOpenFor, setAddressesOpenFor] = useState(null);
  const [preview, setPreview] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, perPage, search, roleFilter],
    queryFn: async () => {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersAPI.getAll(params);
      return res.data.data;
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Delete failed');
    },
  });

  const handleEdit = (u) => { setSelectedUser(u); setIsModalOpen(true); };
  const handleCreate = () => { setSelectedUser(null); setIsModalOpen(true); };
  const handleDelete = (u) => {
    if (window.confirm(`Delete user ${u.first_name} ${u.last_name || ''}?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage platform users</p>
        </div>
        <div className="flex items-center space-x-3">
          <Input placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { label: 'All', value: '' },
              { label: 'Customer', value: 'customer' },
              { label: 'Delivery', value: 'delivery' },
              { label: 'Admin', value: 'admin' },
            ]}
          />
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Add User</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.users?.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-all duration-150">
                      <td className="px-6 py-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.first_name}
                            onClick={() => setPreview(u.avatar_url)}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:scale-110 hover:shadow-md transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-3 text-sm text-gray-800 capitalize">{u.role}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                            <Edit2 className="w-4 h-4 mr-2" />Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAddressesOpenFor(u.id)}>
                            Addresses
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(u)} isLoading={deleteMutation.isPending}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {data?.meta?.total || 0}</div>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => setPage(Math.max(1, page - 1))}>Prev</Button>
          <span className="px-3 py-2 bg-gray-100 rounded">{page}</span>
          <Button variant="secondary" onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedUser ? 'Edit User' : 'Create User'}>
        <UserForm user={selectedUser} onClose={() => setIsModalOpen(false)} onSuccess={() => setSelectedUser(null)} />
      </Modal>

      {/* Profile Lightbox */}
      {preview && (
        <ImageLightbox src={preview} alt="User profile photo" open={!!preview} onClose={() => setPreview(null)} />
      )}

  {/* Admin user addresses modal */}
  {addressesOpenFor && (
    <AdminUserAddresses userId={addressesOpenFor} open={!!addressesOpenFor} onClose={() => setAddressesOpenFor(null)} />
  )}
    </div>
  );
};

export default Users;
