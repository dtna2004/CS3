import { API_URL } from './constants.js';

class DateLocationSuggester {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentLocation = null;
        this.selectedLocation = null;
    }

    async init() {
        try {
            // Khởi tạo bản đồ
            this.map = L.map('mapContainer').setView([21.0285, 105.8542], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Lấy vị trí hiện tại
            await this.getCurrentLocation();

            // Thêm control tìm kiếm
            this.addSearchControl();
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    async getCurrentLocation() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Cập nhật vị trí trên bản đồ
            this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 15);
            
            // Thêm marker cho vị trí hiện tại
            L.marker([this.currentLocation.lat, this.currentLocation.lng])
                .addTo(this.map)
                .bindPopup('Vị trí của bạn')
                .openPopup();

        } catch (error) {
            console.error('Error getting location:', error);
        }
    }

    addSearchControl() {
        const searchControl = L.Control.extend({
            options: {
                position: 'topleft'
            },

            onAdd: () => {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control search-control');
                const input = L.DomUtil.create('input', 'search-input', container);
                input.type = 'text';
                input.placeholder = 'Tìm địa điểm...';

                input.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                        await this.searchLocation(input.value);
                    }
                });

                return container;
            }
        });

        this.map.addControl(new searchControl());
    }

    async searchLocation(query) {
        try {
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=YOUR_OPENCAGE_API_KEY&language=vi&countrycode=vn`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const location = data.results[0];
                const { lat, lng } = location.geometry;

                // Xóa markers cũ
                this.clearMarkers();

                // Thêm marker mới
                const marker = L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(location.formatted);

                this.markers.push(marker);
                this.map.setView([lat, lng], 15);

                // Lưu địa điểm đã chọn
                this.selectedLocation = {
                    name: location.formatted,
                    lat,
                    lng,
                    details: location.components
                };

                // Phân tích địa điểm bằng AI
                await this.analyzeLocation();
            }
        } catch (error) {
            console.error('Error searching location:', error);
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    async analyzeLocation() {
        if (!this.selectedLocation) return;

        try {
            const API_URL = window.API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/analyze-location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    location: this.selectedLocation,
                    currentLocation: this.currentLocation
                })
            });

            if (response.ok) {
                const analysis = await response.json();
                this.showAnalysis(analysis);
            }
        } catch (error) {
            console.error('Error analyzing location:', error);
        }
    }

    showAnalysis(analysis) {
        const analysisContainer = document.getElementById('locationAnalysis');
        if (!analysisContainer) return;

        analysisContainer.innerHTML = `
            <div class="analysis-card">
                <h3>Phân tích địa điểm</h3>
                <p><strong>Địa điểm:</strong> ${this.selectedLocation.name}</p>
                <p><strong>Đánh giá:</strong> ${analysis.rating}/5</p>
                <p><strong>Lý do phù hợp:</strong></p>
                <ul>
                    ${analysis.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
                <p><strong>Gợi ý hoạt động:</strong></p>
                <ul>
                    ${analysis.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
                <button onclick="shareDateLocation()" class="share-btn">
                    Chia sẻ địa điểm này
                </button>
            </div>
        `;
    }
}

// Khởi tạo và gán vào window
window.dateLocationSuggester = new DateLocationSuggester();

// Hàm chia sẻ địa điểm
window.shareDateLocation = function() {
    if (!window.dateLocationSuggester.selectedLocation) return;

    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const locationMessage = `📍 Gợi ý địa điểm hẹn hò: ${window.dateLocationSuggester.selectedLocation.name}
🗺️ Link: https://www.google.com/maps?q=${window.dateLocationSuggester.selectedLocation.lat},${window.dateLocationSuggester.selectedLocation.lng}`;

    messageInput.value = locationMessage;
}; 