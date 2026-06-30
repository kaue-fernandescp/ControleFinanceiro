document.addEventListener("DOMContentLoaded", async () => {
    console.log("Inicializando Dashboard...");
    await inicializarDashboard();
});

// Função para iniciar o dashboard
async function inicializarDashboard() {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth();

    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1).toISOString();
    const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59).toISOString();

    const primeiroDiaAno = new Date(anoAtual, 0, 1).toISOString();
    const ultimoDiaAno = new Date(anoAtual, 11, 31, 23, 59, 59).toISOString();

    const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select('mov_created_at, mov_valor, mov_tipo')
        .gte('mov_created_at', primeiroDiaAno)
        .lte('mov_created_at', ultimoDiaAno);

    if (error) {
        console.error("Erro ao carregar dados do dashboard:", error.message);
        return;
    }

    let entradasMes = 0;
    let saidasMes = 0;

    let entradasAnoPorMes = new Array(12).fill(0);
    let saidasAnoPorMes = new Array(12).fill(0);

    movimentacoes.forEach(mov => {
        const dataMov = new Date(mov.mov_created_at);
        const mesMov = dataMov.getMonth();
        const valorNum = Number(mov.mov_valor);
        const tipoNum = Number(mov.mov_tipo);

        if (tipoNum === 1) {
            entradasAnoPorMes[mesMov] += valorNum;
        } else if (tipoNum === 2) {
            saidasAnoPorMes[mesMov] += valorNum;
        }

        if (dataMov >= new Date(primeiroDiaMes) && dataMov <= new Date(ultimoDiaMes)) {
            if (tipoNum === 1) entradasMes += valorNum;
            if (tipoNum === 2) saidasMes += valorNum;
        }
    });

    const totalSaldoAtual = entradasMes - saidasMes;

    document.getElementById('total-entradas').innerText = entradasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-saidas').innerText = saidasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const elSaldo = document.getElementById('saldo-total');
    elSaldo.innerText = totalSaldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    elSaldo.style.color = totalSaldoAtual >= 0 ? 'var(--accent-green, #22c55e)' : 'var(--accent-red, #ef4444)';

    renderizarGraficoAnual(entradasAnoPorMes, saidasAnoPorMes);
}

function renderizarGraficoAnual(dadosEntradas, dadosSaidas) {
    const ctx = document.getElementById('grafico-anual').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [
                {
                    label: 'Entradas',
                    data: dadosEntradas,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3,
                    borderWidth: 3,
                    pointBackgroundColor: '#22c55e'
                },
                {
                    label: 'Saídas',
                    data: dadosSaidas,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                    borderWidth: 3,
                    pointBackgroundColor: '#ef4444' 
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff', font: { family: 'sans-serif', size: 12} }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}