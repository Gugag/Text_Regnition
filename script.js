let qrCodeDataUrl;

        function showFields() {
            const type = document.getElementById('type').value;
            document.getElementById('link-group').style.display = type === 'link' ? 'block' : 'none';
            document.getElementById('pdf-group').style.display = type === 'pdf' ? 'block' : 'none';
            document.getElementById('vcard-group').style.display = type === 'vcard' ? 'block' : 'none';
            document.getElementById('text-group').style.display = type === 'text' ? 'block' : 'none';
            document.getElementById('wifi-group').style.display = type === 'wifi' ? 'block' : 'none';
        }

        function generateQRCode() {
            const type = document.getElementById('type').value;
            let data = '';

            if (type === 'link') {
                data = document.getElementById('link').value;
            } else if (type === 'pdf') {
                data = document.getElementById('pdf').value;
            } else if (type === 'vcard') {
                const name = document.getElementById('vcard-name').value;
                const phone = document.getElementById('vcard-phone').value;
                const email = document.getElementById('vcard-email').value;
                data = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            } else if (type === 'text') {
                data = document.getElementById('text').value;
            } else if (type === 'wifi') {
                const ssid = document.getElementById('wifi-ssid').value;
                const password = document.getElementById('wifi-password').value;
                const encryption = document.getElementById('wifi-encryption').value;
                data = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
            }

            QRCode.toDataURL(data, function (err, url) {
                if (err) console.error(err);

                const img = document.createElement('img');
                img.src = url;
                const qrCodeContainer = document.getElementById('qr-code');
                qrCodeContainer.innerHTML = '';
                qrCodeContainer.appendChild(img);

                qrCodeDataUrl = url;

                const downloadButtons = document.getElementById('download-buttons');
                downloadButtons.style.display = 'flex';
            });
        }

        function downloadAsPDF() {
            const jsPDF = window.jspdf.jsPDF;
            const pdf = new jsPDF();
            pdf.addImage(qrCodeDataUrl, 'PNG', 15, 40, 180, 180);
            pdf.save('qr_code.pdf');
        }

        function downloadAsJPEG() {
            const link = document.createElement('a');
            link.href = qrCodeDataUrl;
            link.download = 'qr_code.jpeg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
