// Função para carregar os recorrentes
async function carregarMenusRecorrentes() {
    console.log("Iniciando busca no Supabase...");

    const { data: recorrentes, error } = await supabase
        .from('recorrentes')
        .select(`
            rec_id,
            rec_nome,
            rec_valor,
            rec_descricao,
            rec_status,
            tipos:rec_tipo (
                tip_nome
            )
        `);
    
    if (error) {
        console.error('Erro ao buscar recorrentes: ', error);
        return;
    }

    const entradas = recorrentes.filter(item => item.tipos.tip_nome.toLowerCase() === 'entrada');
    const saidas = recorrentes.filter(item => item.tipos.tip_nome.toLowerCase() === 'saida');

    renderizarItensNoMenu(entradas, 'container-entradas-recorrentes');
    renderizarItensNoMenu(saidas, 'container-saidas-recorrentes');
}

// Função para renderizar os itens no HTML
function renderizarItensNoMenu(listaItens, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (listaItens.length === 0) {
        container.innerHTML = '<p class="descricao">Nenhum item cadastrado.</p>';
        return;
    }

    listaItens.forEach(item => {
        const checkedAttribute = item.rec_status ? 'checked' : '';
        const itemHTML = `
            <div class="item">
                <div class="item-header">
                    <input type="checkbox"
                        class="item-checkbox"
                        id="rec-${item.rec_id}"
                        ${checkedAttribute}
                        onchange="alterarStatusRecorrente(${item.rec_id}, this.checked)">
                    <label for="rec-${item.rec_id}" class="titulo-item">${item.rec_nome}</label>
                </div>
                <p class="valor">R$ ${Number(item.rec_valor).toFixed(2)}</p>
                <p class="descricao">${item.rec_descricao || 'Sem descrição.'}</p>
            </div>
        `;

        container.innerHTML += itemHTML;
    });
}

// Função para alterar o status do item para contabilizar na conta do saldo
async function alterarStatusRecorrente(idItem, novoStatus) {
    console.log(`Atualizando item ${idItem} para o status: ${novoStatus}`);

    const { data, error } = await supabase
        .from('recorrentes')
        .update({rec_status: novoStatus})
        .eq('rec_id', idItem);

    if (error) {
        console.error(`Erro ao atualizar o status do item ${idItem}: `, error.message);
        alert('Não foi possível salvar a alteração no banco de dados.');

        const checkbox = document.getElementById(`rec-${idItem}`);
        if (checkbox) checkbox.checked = !novoStatus;
        return;
    }

    console.log(`Item ${idItem} atualizado com sucesso no Supabase!`);
}

// Executar
document.addEventListener("DOMContentLoaded", () => {
    carregarMenusRecorrentes();
    console.log("Busca feita e retornado os itens.")
});