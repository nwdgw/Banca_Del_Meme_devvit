import type { InvestmentRecord, InvestorRecord } from './models.js';
import { formatInt, formatNumber, investmentDurationString } from './utils.js';

export function modifyCreate(username: string, balance: number): string {
  return `*Conto creato!*
Grazie ${username} per aver creato un conto /r/BancaDelMeme!
Il tuo saldo iniziale è **${formatInt(balance)} Mem€**.
Per maggiori informazioni dai un'occhiata alla
[guida di benvenuto](/r/BancaDelMeme/wiki/config/welcome_message).`;
}

export const CREATE_EXISTS_ORG =
  'Non capisco se sei troppo entusiasta o stai cercando di truffarmi. Hai già un account!';

function headerInvestment(amount: number, initialUpvotes: number): string {
  return `*${formatInt(amount)} Mem€ investiti @ ${initialUpvotes} upvote*\n`;
}

export function modifyInvest(
  amount: number,
  initialUpvotes: number,
  newBalance: number,
  investmentDurationSeconds: number
): string {
  const durationVar = investmentDurationString(investmentDurationSeconds);
  return (
    headerInvestment(amount, initialUpvotes) +
    `Il tuo investimento è ora attivo.
Valuterò il tuo profitto in ${durationVar}
e aggiornerò questo stesso commento. Non facciamo che ci perdiamo di vista!
Il tuo saldo attuale è **${formatNumber(newBalance)} Mem€**.`
  );
}

export function modifyInvestReturn(
  amount: number,
  initialUpvotes: number,
  finalUpvotes: number,
  returned: number,
  profit: number,
  newBalance: number
): string {
  let text = headerInvestment(amount, initialUpvotes);
  text += '\nUPDATE: Il tuo investimento è maturato. ';
  if (profit > 0) {
    text += `È andato alla grande! Hai guadagnato ${formatInt(profit)} Mem€`;
  } else if (profit < 0) {
    text += `Non è andato bene! Hai perso ${formatInt(-profit)} Mem€`;
  } else {
    text += `Sei andato in pari! Hai guadagnato ${formatInt(profit)} Mem€`;
  }
  text += ` (${Math.round((profit / amount) * 100)}%).\n`;
  text += `\n*${formatInt(returned)} Mem€ restituiti @ ${formatInt(finalUpvotes)} upvote*\n`;
  text += `\nIl tuo nuovo saldo is **${formatNumber(newBalance)} Mem€**.`;
  return text;
}

export function modifyInvestCapped(
  amount: number,
  initialUpvotes: number,
  _finalUpvotes: number,
  _returned: number,
  profit: number,
  newBalance: number
): string {
  let text = headerInvestment(amount, initialUpvotes);
  text += '\nUPDATE: Il tuo investimento è maturato. ';
  text += `È andato alla grande! Hai guadagnato ${formatInt(profit)} Mem€`;
  text += ` (${Math.round((profit / amount) * 100)}%).\n`;
  text += `**Congratulazioni,** hai raggiunto il saldo massimo!
Hai trionfato in questa sanguinosa competizione nel marketplace
e il tuo portafoglio è gonfissimo!
Le future generazioni ti ricorderanno come titano degli investimenti.
*"Alessandro pianse, poiché non c'erano altri mondi da conquistare.."* (...ancora)\n`;
  text += `\nIl tuo nuovo saldo is **${formatInt(newBalance)} Mem€** (il saldo massimo).`;
  return text;
}

export function notifyCapped(
  investor: InvestorRecord,
  permalink: string
): [string, string] {
  const text =
    `L'investitore u/${investor.name} ha raggiunto il limite di ${formatInt(investor.balance)} Mem€` +
    ` con [questo investimento](${permalink}).` +
    '\n\n Valutate se chiudere la stagione.';
  return [`Limite raggiunto per ${investor.name}`, text];
}

export function modifyInsuff(balanceT: number): string {
  return `Non hai abbastanza Mem€ per fare questo investimento.
Il tuo saldo attuale è **${formatInt(balanceT)} Mem€**.
Se hai meno di 100 Mem€ e nessun investimento in corso, prova ad inviare \`!bancarotta\`!`;
}

export function modifyBroke(times: number, newBalance: number): string {
  return `OOps, sei in bancarotta.
Il tuo saldo è stato resettato a ${newBalance} Mem€. Sta attento la prossima volta.
Sei andato in bancarotta ${times} volte.`;
}

export function modifyBrokeActive(active: number): string {
  let text = 'Hai ancora 1 investimento attivo.';
  if (active > 1) {
    text = `Hai ancora ${active} investimenti attivi.`;
  }
  return text + '\n\nDovrai attendere che vengano completati.';
}

export function modifyBrokeMoney(amount: number): string {
  return `Non sei così povero! Hai ancora **${amount} Mem€**.`;
}

export const HELP_ORG = `*Benvenuto su BancaDelMeme!*
Io sono un bot che vi aiuterà ad investire in *MEME* e farci una fortuna. Mica come le criptovalute.
Ecco una lista di tutti i comandi che funzionano con me:
### COMANDI GENERALI
- \`!attivi\` - Mostra gli investimenti attivi
- \`!saldo\` - Mostra quanti Mem€ si hanno ancora da spendere
- \`!bancarotta\` - Da usare se si scende sotto i 100 Mem€
- \`!crea\` - Crea un conto di investimento
- \`!aiuto\` - Mostra questo messaggio
- \`!investi <quantità>\` - Permette di investire i propri Mem€
- \`!investitutto\` - Permette di investire tutti i propri Mem€
- \`!mercato\` - Mostra il MeMercato Azionario attuale
- \`!top\` - Mostra i migliori investitori
- \`!vendi\` - Chiude in anticipo gli investimenti in quel topic (con penalità)
- \`!versione\` - Mostra la versione attuale del bot
- \`!template https://imgur.com/...\` **(solo per OP, utile per linkare i template)**
Per avere aiuto su un singolo comando, semplicemente scrivi \`!aiuto\`
Per altre informazioni e più dettagli,
fai riferimento alla [spiegazione estesa](https://www.reddit.com/r/BancaDelMeme/wiki/regolamento).`;

export function modifyBalance(balance: number, netWorth: number): string {
  return `Attualmente, il tuo saldo è **${formatInt(balance)} Mem€**.
In investimenti hai ${formatInt(netWorth - balance)} Mem€ impegnati,
per un patrimonio totale di ${formatInt(netWorth)} Mem€.`;
}

function formatHms(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function modifyActive(
  activeInvestments: InvestmentRecord[],
  investmentDurationSeconds: number,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
): string {
  if (activeInvestments.length === 0) {
    return 'Non hai alcun investimento attivo al momento.';
  }
  const lines = activeInvestments.map((inv, idx) => {
    const secondsRemaining = inv.time + investmentDurationSeconds - nowEpochSeconds;
    const remainingString =
      secondsRemaining > 0
        ? `${formatHms(secondsRemaining)} rimanenti`
        : 'in elaborazione';
    return `[#${idx + 1}](/r/BancaDelMeme/comments/${inv.post}/_/${inv.comment}): ${formatInt(inv.amount)} Mem€ @ ${inv.upvotes} upvote (${remainingString})`;
  });
  return (
    `Hai ${activeInvestments.length} investimenti attivi: \n\n` +
    lines.join('\n\n')
  );
}

export function modifyMinInvest(minim: number): string {
  return `L'investimento minimo consentito è
di 100 Mem€ o di ${formatInt(Math.round(minim))} (1% del tuo saldo);
il più alto dei due.`;
}

export function modifyMarket(
  inves: number,
  cap: number,
  invsCap: number
): string {
  return `Il mercato, in questo momento, ha **${formatInt(inves)}** investimenti attivi.
Tutti gli investitori possiedono **${formatInt(cap)} Mem€**.
Ci sono **${formatInt(invsCap)} Mem€** in circolazione su investimenti al momento.`;
}

export function modifyTop(
  leaders: Array<{ name: string; networth: number }>
): string {
  let topString =
    'Gli investitori con il valore netto più alto (saldo + investimenti attivi):\n\n';
  for (const leader of leaders) {
    topString += `\n\n${leader.name}: ${formatInt(leader.networth)} Mem€`;
  }
  return topString;
}

const TEMPLATE_HINT_ORG = `
---
Psst, %NAME%, puoi scrivere \`!template https://imgur.com/...\`
per pubblicare il template del tuo post! Alla fine è uno degli scopi di BancaDelMeme! ;)`;

export const INVEST_PLACE_HERE_NO_FEE = `**GLI INVESTIMENTI VANNO QUI - SOLO LE RISPOSTE DIRETTE A QUESTO MESSAGGIO VERRANNO ELABORATE**
Per prevenire spam e altri catastrofi naturali, considero solamente risposte a questo messaggio.
Altri comandi verranno ignorati e potrebbero addirittura venire penalizzati.
Teniamo il nostro MeMercato Azionario bello pulito!
---
Nuovo utente? Ti senti perso e confuso?
Rispondi \`!aiuto\` a questo messaggio,
o visita la pagina [Wiki](https://www.reddit.com/r/BancaDelMeme/wiki/index)
per una spiegazione più dettagliata.`;

export function investNoFee(name: string): string {
  return INVEST_PLACE_HERE_NO_FEE + TEMPLATE_HINT_ORG.replace('%NAME%', name);
}

export const CLOSED_ORG = `**La stagione è chiusa.**
Non è possibile fare nuovi investimenti.  I nuovi post sono comunque i benvenuti.`;

export const MAINTENANCE_ORG = `**Il bot è in manutenzione per ragioni tecniche.**
**Dovrebbe tornare online a breve. (Qualche ora)**
**Ci scusiamo per ogni disagio causato.**`;

export const TEMPLATE_NOT_OP = 'Spiacente, ma non sei OP';
export const TEMPLATE_ALREADY_DONE =
  'Spiacente, ma hai già inviato il link template.';
export const TEMPLATE_NOT_STICKY =
  'Spiacente, ma devi rispondere *direttamente* al messaggio stickato del bot.';

export function modifyTemplateOp(link: string, name: string): string {
  return `
---
OP ${name} ha postato *[IL LINK AL TEMPLATE](${link})*, Evviva!\n\n`;
}

export function modifyDeployVersion(date: string): string {
  return `La versione corrente del bot è stata installata il \`${date}\``;
}

export const TEMPLATE_SUCCESS =
  'Template postato con successo! Grazie per aver reso /r/BancaDelMeme un posto migliore!';

export function modifySellInvestment(
  numInvestments: number,
  taxes: number
): string {
  if (numInvestments < 1) {
    return 'Nessun investimento attivo trovato in questo post';
  }
  const plural = numInvestments > 1;
  const il = plural ? '' : 'l';
  const agg = plural ? 'i' : 'o';
  const verb = plural ? 'sono' : 'è';
  const tuo = plural ? 'i' : '';
  const verr = plural ? 'anno' : 'à';
  return `I${il} tuo${tuo} investiment${agg} ${verb} stat${agg} decrementat${agg} di ${formatNumber(taxes)} Mem€ e chius${agg}.
A breve i${il} comment${agg} verr${verr} aggiornat${agg} con il risultato.`;
}

export function modifyOcReturn(profit: number): string {
  return `\n\n---\n\nGrazie del tuo OC!  Per premiarti ti è stato accreditato un bonus
pari all'1% degli investimenti (non tuoi) su questo post.
Hai guadagnato cosi ${formatInt(profit)} Mem€`;
}

export const modifyOcCapped = `\n\n---\n\nGrazie del tuo OC!  Per premiarti ti è stato accreditato un bonus
pari all'1% degli investimenti su questo post (ma non i tuoi).
Hai cosi raggiunto il saldo massimo!
Hai trionfato in questa sanguinosa competizione nel marketplace
e il tuo portafoglio è gonfissimo!
Le future generazioni ti ricorderanno come titano degli investimenti.
*"Alessandro pianse, poiché non c'erano altri mondi da conquistare.."*`;

export function cmdSconosciuto(): string {
  return 'Non conosco il comando che mi hai inviato, il tuo messaggio è stato ignorato.';
}

export function rimozione(rule: string, extra?: string): string {
  const extraStr = extra ? `: ${extra}` : '';
  return `Il tuo post è stato rimosso
perché non rispetta la regola ${rule}${extraStr}.
Controlla [le regole](/r/BancaDelMeme/about/rules/), sono poche ma importanti.  Se hai dubbi [contattaci](/message/compose/?to=/r/BancaDelMeme).`;
}
