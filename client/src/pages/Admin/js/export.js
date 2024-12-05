class ExportManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportUserData();
        });
    }

    async exportUserData() {
        try {
            // Fetch user data
            const response = await fetch('/api/admin/users/export');
            const users = await response.json();

            // Convert to CSV
            const csv = this.convertToCSV(users);

            // Download file
            this.downloadCSV(csv, 'user_data.csv');
        } catch (error) {
            console.error('Error exporting user data:', error);
            alert('Failed to export user data. Please try again.');
        }
    }

    convertToCSV(users) {
        // Define columns
        const columns = [
            'ID',
            'Name',
            'Age',
            'Gender',
            'Location',
            'Occupation',
            'Interests',
            'Lifestyle',
            'Goals',
            'Values',
            'Matches Count',
            'Success Rate',
            'Join Date'
        ];

        // Create header row
        let csv = columns.join(',') + '\n';

        // Add data rows
        users.forEach(user => {
            const row = [
                user._id,
                `"${user.name}"`,
                user.age,
                user.gender,
                `"${user.location?.coordinates?.join(', ')}"`,
                `"${user.occupation}"`,
                `"${user.interests?.join('; ')}"`,
                `"${user.lifestyle?.join('; ')}"`,
                `"${user.goals?.join('; ')}"`,
                `"${user.values?.join('; ')}"`,
                user.matches?.length || 0,
                this.calculateSuccessRate(user),
                user.createdAt
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    calculateSuccessRate(user) {
        if (!user.matches || user.matches.length === 0) return '0%';
        
        const successfulMatches = user.matches.filter(match => match.status === 'success').length;
        const rate = (successfulMatches / user.matches.length) * 100;
        return `${rate.toFixed(1)}%`;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Create download link
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    window.exportManager = new ExportManager();
}); 