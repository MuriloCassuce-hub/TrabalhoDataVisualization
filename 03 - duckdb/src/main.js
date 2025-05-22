import { Taxi } from "./taxi";

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

<<<<<<< Updated upstream
    // Cria o cabeçalho da tabela
=======
    // Cria o cabeÃ§alho da tabela
>>>>>>> Stashed changes
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });
    tableHTML += '<th>weekday_number</th>';  // Nova coluna para o dia da semana

    tableHTML += '</tr>';

<<<<<<< Updated upstream
    // Cria o corpo da tabela
    data.forEach(item => {
        tableHTML += '<tr>';
=======
    // Mapeamento de nomes dos dias (opcional)
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Cria o corpo da tabela
    // Cria o corpo da tabela
    data.forEach(item => {
        tableHTML += '<tr>';
        
        let pickupDate = null;
        
>>>>>>> Stashed changes
        Object.entries(item).forEach(([key, value]) => {
            if (
                (key === 'lpep_pickup_datetime' || key === 'lpep_dropoff_datetime') &&
                typeof value === 'number'
            ) {
                const date = new Date(value);
<<<<<<< Updated upstream
                const formatted = date.toISOString(); // <-- CORRETO
=======
                const formatted = date.toISOString();
                
                // Guarda a data de pickup para calcular o dia depois
                if (key === 'lpep_pickup_datetime') {
                    pickupDate = date;
                }
                
>>>>>>> Stashed changes
                tableHTML += `<td>${formatted}</td>`;
            } else {
                tableHTML += `<td>${value}</td>`;
            }
        });

        // Adiciona a nova coluna com o número do dia da semana (1-7)
        if (pickupDate) {
            // getDay() retorna 0-6 (Domingo=0), então adicionamos 1 para ficar 1-7
            const weekdayNumber = pickupDate.getDay() + 1;
            tableHTML += `<td>${weekdayNumber}</td>`;
        } else {
            tableHTML += '<td>N/A</td>';
        }

        tableHTML += '</tr>';
    });

    tableHTML += '</table>';

    const div = document.querySelector("#table");
    if(div) {
        div.innerHTML += tableHTML;
    }
}

window.onload = async () => {
    const months = 6;
    const limit = 50;

    const taxi = new Taxi();

    await taxi.init();
    await taxi.loadTaxi(months);
    const data = await taxi.test(limit);

    createTableWithInnerHTML(data);

    console.log('teste');
};