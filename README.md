To test project:
    - truffle test

1. Let's say you have already implemented a standardized ERC-20 smart contract for some token. 
Now you want to add the possibility of securely updating the balances between any two users, off-chain using state channel technique. 
Can you write simple JavaScript/TypeScript/NodeJS code that generates state channel receipts (signed by both users) and one Solidity function that validates that receipt and updates the balances accordingly? Note that these 2 users can update their balances off-chain multiple times before they actually want to settle it on-chain.
    Ho creato la funzione javascript per creare la ricevuta all'interno della classe ./utilities/paymentChannel.js .
    Da quello che mi è sembrato di capire dalla descrizione sembra che la ricevuta debba essere firmata da entrambe gli utenti contemporaneamente.
    Non credo che questo abbia molto senso, perchè il ricevente ha bisogno della firma del mittente per validare la ricevuta, ma non ha bisogno della propria firma
    in fase di validazione, in quanto, ovviamente, non ha bisogno di verificare se stesso.
    Per cui ho creato la funzione signPayment che può essere usata da entrambe gli indirizzi per generare una ricevuta da inviare all'altra parte.
    Volendo generare una ricevuta firmata da entrambe contemporaneamente è possibile richiamare questa funzione due volte, la prima volta dall'indirizzo1 con i dati dell'operazione e la seconda volta dall'indirizzo 2, aggiungendo ai dati l'output della prima chiamata, come detto precedentemente però non credo che abbia senso fare questa cosa se non è necessario un terzo indirizzo che abbia necessità di verificare le altre firme.

2. What happens if one of the users present to the smart contract one of the older version of the receipt (that reflects bigger balance for that user then it would otherwise reflect if he presented the most recent receipt)? How we can prevent situations like that from happening or how we can make sure even if it happens the other honest user can always overwrite/challange the balance with the more recent/accurate receipt?
dopo che un utente reclama la sua

3. Theoretical question, give me all your ideas you can find for this problem: assuming the user needs to put also the actual timestamp to the receipt, how another party (another user) can validate that timestamp was really actual/current? How we can make sure the margin error of that validation is smallest possible? Any ideas, even most crazy ones count :-)