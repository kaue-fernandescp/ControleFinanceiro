// Função para salvar transações
function salvarTransacao(descricao, valor, tipo) {
    const transacoesAtuais = JSON.parse(localStorage.getItem('transacoes')) || [];

    // Nova transação
    const novaTransacao = {
        id: Date.now(),
        descricao: descricao,
        valor: parseFloat(valor),
        tipo: tipo,
        data: new Date().toLocaleDateString('pt-BR')
    };

    // Adicionar na lista de transações
    transacoesAtuais.push(novaTransacao);
    localStorage.setItem('transacoes', JSON.stringify(transacoesAtuais));

    console.log("Salvo com sucesso!");
    atualizarDashboard();
    exibirTransacoes();
}

// Função para buscar as transações
function obterTransacoes() {
    return JSON.parse(localStorage.getItem('transacoes')) || [];
}

// Função para somar e retornar o saldo
function atualizarDashboard() {
    const transacoes = obterTransacoes();
    console.log("Transações encontradas: ", transacoes);

    let entradasTotal = 0;
    let saidasTotal = 0;

    transacoes.forEach(transacao => {
        if (transacao.tipo.toLowerCase() === 'entrada') {
            entradasTotal += transacao.valor;
        } else if (transacao.tipo.toLowerCase() === 'saída' || transacao.tipo.toLowerCase() === 'saida') {
            saidasTotal += transacao.valor;
        }
    });

    const saldoTotal = entradasTotal - saidasTotal;

    const elEntrada = document.getElementById('total-entradas');
    const elSaida = document.getElementById('total-saidas');
    const elSaldo = document.getElementById('saldo-total') || document.getElementById('saldo-atual-carteira');

    if (elEntrada) {
        elEntrada.innerText = entradasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (elSaida) {
        elSaida.innerText = saidasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    // Se o saldo for negativo = vermelho, se for positivo = verde
    if (elSaldo) {
        elSaldo.innerText = saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        elSaldo.style.color = saldoTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
}

function exibirTransacoes() {
    const listaElemento = document.getElementById('lista-transacoes');
    if (!listaElemento) return;

    const transacoes = obterTransacoes();

    listaElemento.innerHTML = "";

    if (transacoes.length === 0) {
        listaElemento.innerHTML = '<p class="msg-vazia"> Nenhuma movimentação realizada.</p>'
        return;
    }

    const ultimasCinco = transacoes.reverse().slice(0, 5);

    ultimasCinco.forEach(transacao => {
        const item = document.createElement('div');
        item.classList.add('item-transacao');

        const corClasse = transacao.tipo.toLowerCase() === 'entrada' ? 'txt-entrada' : 'txt-saida';

        item.innerHTML = `
            <div class="info-esquerda">
                <span class="data-transacao">${transacao.data}</span>
                <strong class="desc-transacao">${transacao.descricao}</strong>
            </div>
            <div class="info-direita">
                <span class="valor-transacao ${corClasse}">
                    ${transacao.tipo === 'Entrada' ? '+' : '-'} 
                    ${transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        `;
        listaElemento.appendChild(item);
    });
}

window.onload = () => {
    atualizarDashboard();
    exibirTransacoes();
} 

// Formulário de Entrada
const formEntrada = document.getElementById('form-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc-entrada').value;
        const valor = document.getElementById('valor-entrada').value;

        salvarTransacao(desc, valor, 'Entrada');
        formEntrada.reset();
    })
}

// Formulário de Saída
const formSaida = document.getElementById('form-saida');
if (formSaida) {
    formSaida.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc-saida').value;
        const valor = document.getElementById('valor-saida').value;
        
        salvarTransacao(desc, valor, 'Saída');
        formSaida.reset();
    });
}