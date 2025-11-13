class ProfileManager {
  constructor() {
    this.socket = null;
    this.userId = localStorage.getItem('userId');
    this.userName = localStorage.getItem('userName');
    this.apiUrl = 'http://localhost:3000/api';
    this.currentUser = null;
  }

  initSocket() {
    if (!this.userId) {
      window.location.href = 'login.html';
      return;
    }

    console.log('Iniciando conexão Socket.io com userId:', this.userId);
    this.socket = io('http://localhost:3000');
    
    this.socket.on('connect', () => {
      console.log('Socket conectado, emitindo join com userId:', this.userId);
      this.socket.emit('join', this.userId);
    });

    this.socket.on('user_data', (data) => {
      console.log('Recebido user_data:', data);
      if (data.success) {
        this.currentUser = data.user;
        this.displayProfile(data.user);
      } else {
        console.error('Erro ao carregar:', data.message);
      }
    });

    this.socket.on('profile_changed', (data) => {
      console.log('Profile alterado:', data);
      if (data.success) {
        this.currentUser = data.user;
        this.displayProfile(data.user);
      }
    });

    this.socket.on('auth_error', () => {
      console.error('Erro de autenticação no socket');
      window.location.href = 'login.html';
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.io:', error);
    });
  }

  async updateProfile(name, bio, imageFile) {
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (bio) formData.append('bio', bio);
      if (imageFile) formData.append('profile_picture', imageFile);

      const response = await fetch(`${this.apiUrl}/profile`, {
        method: 'PUT',
        headers: { 'X-User-Id': this.userId },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        this.socket.emit('profile_updated', { 
          name: name || this.currentUser.name, 
          bio: bio || this.currentUser.bio, 
          profile_picture: data.profile_picture || this.currentUser.profile_picture 
        });
      } else {
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }

  async deleteAccount() {
    try {
      const response = await fetch(`${this.apiUrl}/profile`, {
        method: 'DELETE',
        headers: { 'X-User-Id': this.userId }
      });

      const data = await response.json();
      if (data.success) {
        localStorage.clear();
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
      }
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
    }
  }

  displayProfile(user) {
    const div = document.getElementById('profile-container');
    if (!div) return;

    console.log('Exibindo perfil:', user);

    const pic = user.profile_picture 
      ? `<img src="http://localhost:3000${user.profile_picture}" alt="${user.name}" class="profile-picture">` 
      : '<div class="profile-picture-placeholder">📷</div>';

    div.classList.remove('loading');
    div.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-picture-container">
            ${pic}
            <button class="profile-picture-upload" id="upload-photo-btn" title="Alterar foto">📷</button>
            <input type="file" id="photo-input" accept="image/*" style="display: none;">
          </div>
          <div class="profile-info">
            <h2>${user.name}</h2>
            <p class="email">📧 ${user.email}</p>
            <p class="bio">${user.bio || 'Nenhuma bio adicionada'}</p>
          </div>
        </div>

        <div class="edit-section">
          <h3>Editar Dados do Perfil</h3>
          <form id="edit-form">
            <div class="form-group">
              <label for="edit-name">Nome</label>
              <input type="text" id="edit-name" value="${user.name}" placeholder="Seu nome" required>
            </div>
            <div class="form-group">
              <label for="edit-bio">Bio</label>
              <textarea id="edit-bio" placeholder="Contar um pouco sobre você...">${user.bio || ''}</textarea>
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary">Salvar Alterações</button>
              <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
            </div>
          </form>
        </div>

        <div class="danger-zone">
          <h3>⚠️ Zona de Perigo</h3>
          <p>Deletar sua conta é uma ação permanente. Você perderá todos os seus dados e não poderá recuperá-los.</p>
          <div class="danger-zone-buttons">
            <button class="btn-delete" id="delete-account-btn">Deletar Conta</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Upload de foto
    const uploadBtn = document.getElementById('upload-photo-btn');
    const photoInput = document.getElementById('photo-input');

    uploadBtn?.addEventListener('click', () => photoInput?.click());
    photoInput?.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.updateProfile(null, null, e.target.files[0]);
      }
    });

    // Salvar alterações de perfil
    document.getElementById('edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value;
      const bio = document.getElementById('edit-bio').value;
      this.updateProfile(name, bio, null);
    });

    // Cancelar edição
    document.getElementById('cancel-edit')?.addEventListener('click', () => {
      if (this.currentUser) {
        document.getElementById('edit-name').value = this.currentUser.name;
        document.getElementById('edit-bio').value = this.currentUser.bio || '';
      }
    });

    // Deletar conta
    document.getElementById('delete-account-btn')?.addEventListener('click', () => {
      this.showDeleteModal();
    });
  }

  showDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
      modal.classList.add('active');

      const confirmBtn = document.getElementById('confirm-delete');
      const cancelBtn = document.getElementById('cancel-delete');

      const handleConfirm = () => {
        modal.classList.remove('active');
        this.deleteAccount();
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      const handleCancel = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pm = new ProfileManager();
  pm.initSocket();

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
});
