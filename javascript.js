// Полный JS код приложения
const API_BASE = 'http://localhost:5075/api';

let selectedPhoto = null;

// Аутентификация
async function register() {
  const email = document.getElementById('regEmail').value;
  const username = document.getElementById('username').value;
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username })
  });
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

async function sendCode() {
  const email = document.getElementById('loginEmail').value;
  await fetch(`${API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const code = document.getElementById('loginCode').value;
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
  document.getElementById('authModal').style.display = 'none';
  loadPhotos();
}

// Фото
async function loadPhotos() {
  const res = await fetch(`${API_BASE}/photos`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const photos = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.previewUrl;
    img.onclick = () => openViewer(photo);
    gallery.appendChild(img);
  });
}

function openViewer(photo) {
  selectedPhoto = photo;
  document.getElementById('viewerImage').src = photo.originalUrl;
  document.getElementById('viewerInfo').innerText = `${photo.device}\n${photo.takenAt}\n${photo.size}`;
  document.getElementById('viewerModal').style.display = 'flex';
}

// Воспоминания
async function loadMemories() {
  const res = await fetch(`${API_BASE}/photos/memories`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const photos = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '<h3>В этот день в прошлые годы:</h3>';
  if (photos.length === 0) {
    gallery.innerHTML += '<p>Нет воспоминаний на эту дату.</p>';
    return;
  }
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.previewUrl;
    img.onclick = () => openViewer(photo);
    gallery.appendChild(img);
  });
}

// Загрузка фото
function setupUpload() {
  const addSelect = document.getElementById('addSelect');
  addSelect.addEventListener('change', async () => {
    if (addSelect.value === 'photo') {
      const albumsRes = await fetch(`${API_BASE}/albums`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const albums = await albumsRes.json();
      let albumId = null;
      if (albums.length > 0) {
        const albumName = prompt('Выберите альбом по названию или оставьте пустым для без альбома:\n' + albums.map(a => a.name).join(', '));
        const album = albums.find(a => a.name === albumName);
        if (album) albumId = album.id;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('file', file);
        if (albumId) formData.append('albumId', albumId);

        const res = await fetch(`${API_BASE}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (res.ok) loadPhotos();
      };
      input.click();
    } else if (addSelect.value === 'album') {
      const name = prompt('Введите название альбома:');
      if (name) {
        fetch(`${API_BASE}/albums`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ name })
        }).then(res => {
          if (res.ok) alert('Альбом создан');
          else alert('Ошибка при создании альбома');
        });
      }
    }
  });
}

async function deletePhoto() {
  if (!selectedPhoto || !confirm('Удалить фото?')) return;

  const res = await fetch(`${API_BASE}/photos/${selectedPhoto.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  if (res.ok) {
    document.getElementById('viewerModal').style.display = 'none';
    loadPhotos();
  } else {
    alert('Не удалось удалить фото.');
  }
}

function sharePhoto() {
  // реализовать
}

function showPhotoInfo() {
  // реализовать
}

async function showAlbums() {
  const res = await fetch(`${API_BASE}/albums`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const albums = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  albums.forEach(album => {
    const div = document.createElement('div');
    div.innerText = `📁 ${album.name}`;
    div.style.cursor = 'pointer';
    div.onclick = () => loadPhotosByAlbum(album.id);
    gallery.appendChild(div);
  });
}

async function loadPhotosByAlbum(albumId) {
  const res = await fetch(`${API_BASE}/albums/${albumId}/photos`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const photos = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.previewUrl;
    img.onclick = () => openViewer(photo);
    gallery.appendChild(img);
  });
}

function manageProfile() {
  const newEmail = prompt('Введите новый email (оставьте пустым, если не менять):');
  const newPassword = prompt('Введите новый пароль (оставьте пустым, если не менять):');
  if (!newEmail && !newPassword) return;
  const updateData = {};
  if (newEmail) updateData.email = newEmail;
  if (newPassword) updateData.password = newPassword;
  fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(updateData)
  }).then(res => {
    if (res.ok) alert('Профиль обновлён');
    else alert('Ошибка при обновлении профиля');
  });
}

function logout() {
  localStorage.removeItem('token');
  location.reload();
}

function faceRecognition() {
  if (!selectedPhoto) return;
  fetch(`${API_BASE}/faces/${selectedPhoto.id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()).then(data => {
    if (!data || data.length === 0) {
      alert('Лица не найдены или не добавлены.');
      return;
    }
    const viewerInfo = document.getElementById('viewerInfo');
    viewerInfo.innerHTML = '<strong>Распознанные лица:</strong><br>';
    data.forEach((f, i) => {
      const label = document.createElement('div');
      label.textContent = `${i + 1}: ${f.name || 'Без имени'}`;
      viewerInfo.appendChild(label);
    });
    const choice = prompt('Выберите номер лица для именования или оставьте пустым:\n' + data.map((f, i) => `${i + 1}: ${f.name || 'Без имени'}`).join('\n'));
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < data.length) {
      const newName = prompt('Введите имя для лица:');
      if (newName) {
        fetch(`${API_BASE}/faces/name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ faceId: data[index].id, name: newName })
        }).then(res => {
          if (res.ok) alert('Имя лица обновлено');
          else alert('Ошибка при обновлении имени');
        });
      }
    }
  });
}

window.onload = () => {
  if (!localStorage.getItem('token')) {
    document.getElementById('authModal').style.display = 'flex';
  } else {
    loadPhotos();
  }
  setupUpload();
  const sidebar = document.getElementById('sidebar');
  const memoryBtn = document.createElement('button');
  memoryBtn.textContent = 'В этот день';
  memoryBtn.onclick = loadMemories;
  sidebar.appendChild(memoryBtn);
  const profileBtn = document.createElement('button');
  profileBtn.textContent = 'Настройки профиля';
  profileBtn.onclick = manageProfile;
  sidebar.appendChild(profileBtn);
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Выйти';
  logoutBtn.onclick = logout;
  sidebar.appendChild(logoutBtn);
};
