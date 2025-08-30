import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Counter } from '../target/types/counter';
import { expect } from 'chai';

describe('counter', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Counter as Program<Counter>;
  const counterKeypair = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      counter: counterKeypair.publicKey,
      user: program.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([counterKeypair]).rpc();
    console.log('Your transaction signature', tx);

    // Fetch the counter account to verify it's initialized with count 0
    const counterAccount = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccount.count).to.equal(0);
  });

  it('Increment counter', async () => {
    // Call the increment instruction
    await program.methods.increment().accounts({
      counter: counterKeypair.publicKey,
    }).rpc();

    // Fetch the counter account to verify the count is now 1
    const counterAccount = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccount.count).to.equal(1);

    // Increment again to make sure it works multiple times
    await program.methods.increment().accounts({
      counter: counterKeypair.publicKey,
    }).rpc();

    // Fetch the counter account to verify the count is now 2
    const counterAccountAfterSecondIncrement = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccountAfterSecondIncrement.count).to.equal(2);
  });

  it('Decrement counter', async () => {
    // Call the decrement instruction
    await program.methods.decrement().accounts({
      counter: counterKeypair.publicKey,
    }).rpc();

    // Fetch the counter account to verify the count is now 1
    const counterAccount = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccount.count).to.equal(1);

    // Decrement again to make sure it works multiple times
    await program.methods.decrement().accounts({
      counter: counterKeypair.publicKey,
    }).rpc();

    // Fetch the counter account to verify the count is now 0
    const counterAccountAfterSecondDecrement = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccountAfterSecondDecrement.count).to.equal(0);
  });

  it('Set counter to specific value', async () => {
    const newCount = 42;
    // Call the set instruction with a new count value
    await program.methods.set(newCount).accounts({
      counter: counterKeypair.publicKey,
    }).rpc();

    // Fetch the counter account to verify the count is now set to 42
    const counterAccount = await program.account.counter.fetch(counterKeypair.publicKey);
    expect(counterAccount.count).to.equal(newCount);
  });
});