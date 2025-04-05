document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Función para subir firma
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Limpiar canvas antes de dibujar nueva imagen
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calcular dimensiones manteniendo relación de aspecto
                const ratio = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height
                );
                const width = img.width * ratio;
                const height = img.height * ratio;
                
                ctx.drawImage(
                    img, 
                    (canvas.width - width) / 2,
                    (canvas.height - height) / 2,
                    width,
                    height
                );
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    function initCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }

    // Eventos del canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawingTouch);
    canvas.addEventListener('touchmove', drawTouch);
    canvas.addEventListener('touchend', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function startDrawingTouch(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        isDrawing = true;
        [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
    }

    function drawTouch(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
        [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
        e.preventDefault();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    window.clearSignature = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('fileInput').value = '';
    }

    window.selectTheme = function(gender) {
        document.body.className = `${gender}-theme`;
        document.querySelector('.welcome-screen').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        initCanvas();
    }

    window.generatePDF = function() {
        const nombre = document.getElementById('nombre').value;
        const tipoDocumento = document.getElementById('tipo-documento').value;
        const documento = document.getElementById('documento').value;
        const tipoCertificado = document.getElementById('tipo-certificado').value;

        if (!nombre || !tipoDocumento || !documento || !tipoCertificado) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        const doc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Encabezado Institucional
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("REGISTRO Y CONTROL CESDE", 20, 20);
        doc.text("LICENCIA DE FUNCIONAMIENTO DE LA SECRETARÍA DE EDUCACIÓN", 20, 25);
        doc.text("DEL MUNICIPIO DE LA PINTADA 2020060127237 DE 2020-12-02", 20, 30);
        doc.text("RESOLUCIÓN OFICIAL DEL PROGRAMA 2021060010827 DE 2021-05-20", 20, 35);
        doc.text("NIT. 890.913.319-1", 20, 40);
        doc.text(`La Pintada, ${new Date().toLocaleDateString()}`, 20, 45);

        // Cuerpo del certificado
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text("LA JEFE DE REGISTRO Y CONTROL", 105, 60, { align: 'center' });
        
        doc.setFont(undefined, 'normal');
        doc.text("CERTIFICA:", 20, 70);
        
        const certificacionText = [
            `Que ${nombre}, identificado con ${tipoDocumento} número ${documento},`,
            "para el período 1-2025 se encuentra cursando el primero de tres",
            "módulos académicos correspondientes al programa:",
            "Técnico Laboral por Competencias en Auxiliar en Desarrollo de Aplicaciones Informáticas",
            "",
            `Tipo de certificado: ${document.getElementById('tipo-certificado').options[document.getElementById('tipo-certificado').selectedIndex].text}`,
            "",
            "De acuerdo con la Ley 115 de 1994 y el Decreto 1075 de 2015, CESDE es una Institución",
            "de Educación para el Trabajo y el Desarrollo Humano.",
            "",
            "Este certificado se expide por Solicitud del Interesado."
        ];

        certificacionText.forEach((line, index) => {
            doc.text(line, 20, 80 + (index * 5));
        });

         // FIRMA DEL ESTUDIANTE (centrada y encima de la firma institucional)
    const signatureData = canvas.toDataURL();
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgWidth = 70; // Ancho de la imagen de firma
    const xPosition = (pageWidth - imgWidth) / 6; // Centrar horizontalmente
    
    // Posición Y: 120mm (20mm arriba de la firma institucional)
    doc.addImage(signatureData, 'PNG', xPosition, 130, imgWidth, 40);

    // FIRMA INSTITUCIONAL (posición original)
    doc.text("___________________________", 20, 160);
    doc.text("SANDRA MILENA BÉTANCUR DEOSSA", 20, 165);
    doc.text("Jefe de Registro y Control", 20, 170);
    doc.text("C.C. 1.128.385.408", 20, 175);
        // Contacto
        doc.setTextColor(100);
        doc.setFontSize(10);
        doc.text("Luisa D. (604) 480 88 22 ext. 2301", 20, 200);
        doc.text("Cesde.edu.co", 20, 205);
        doc.text("Kilómetro 2 vía Puente Iglesias", 20, 210);
        doc.text("Colombia - Antioquia – La Pintada", 20, 215);

        doc.save(`certificado_${documento}.pdf`);
    }

    window.addEventListener('resize', initCanvas);
    initCanvas();
});