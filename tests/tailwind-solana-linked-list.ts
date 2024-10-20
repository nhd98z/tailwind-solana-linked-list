import * as anchor from '@coral-xyz/anchor';
import { Program, Accounts } from '@coral-xyz/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import { TailwindSolanaLinkedList } from '../target/types/tailwind_solana_linked_list';

describe('TailwindSolanaLinkedList', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TailwindSolanaLinkedList as Program<TailwindSolanaLinkedList>;

  async function initializeNode(node: Keypair, data: number) {
    await program.methods
      .initialize(data)
      .accounts({
        node: node.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node])
      .rpc();
  }

  it('1. Initialize Linked List', async () => {
    const node1 = Keypair.generate();
    await initializeNode(node1, 42);

    const node = await program.account.node.fetch(node1.publicKey);
    assert(node.data === 42, 'Initialized node should have data value 42');
    assert(node.next === null, 'Next node should be null');
  });

  it('2. Append to Linked List', async () => {
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();

    await initializeNode(node1, 42);

    await program.methods
      .append(84)
      .accounts({
        currentNode: node1.publicKey,
        newNode: node2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node2])
      .rpc();

    const firstNode = await program.account.node.fetch(node1.publicKey);
    const secondNode = await program.account.node.fetch(node2.publicKey);

    assert(firstNode.next.toString() === node2.publicKey.toString(), 'First node should point to the second node');
    assert(secondNode.data === 84, 'Second node should have data value 84');
    assert(secondNode.next === null, 'Second node should have null next pointer');
  });

  it('3. Insert After', async () => {
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();
    const node3 = Keypair.generate();

    await initializeNode(node1, 42);
    await program.methods
      .append(84)
      .accounts({
        currentNode: node1.publicKey,
        newNode: node2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node2])
      .rpc();

    await program.methods
      .insertAfter(63)
      .accounts({
        currentNode: node1.publicKey,
        newNode: node3.publicKey,
        nextNode: node2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node3])
      .rpc();

    const firstNode = await program.account.node.fetch(node1.publicKey);
    const insertedNode = await program.account.node.fetch(node3.publicKey);

    assert(firstNode.next.toString() === node3.publicKey.toString(), 'First node should point to the inserted node');
    assert(insertedNode.data === 63, 'Inserted node should have data value 63');
    assert(insertedNode.next.toString() === node2.publicKey.toString(), 'Inserted node should point to the last node');
  });

  it('4. Remove Node', async () => {
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();
    const node3 = Keypair.generate();

    // Initialize and build a linked list: 42 -> 63 -> 84
    await initializeNode(node1, 42);
    await program.methods
      .append(63)
      .accounts({
        currentNode: node1.publicKey,
        newNode: node2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node2])
      .rpc();
    await program.methods
      .append(84)
      .accounts({
        currentNode: node2.publicKey,
        newNode: node3.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node3])
      .rpc();

    // Remove the middle node (63)
    await program.methods
      .remove()
      .accounts({
        currentNode: node1.publicKey,
        nextNode: node2.publicKey,
        user: provider.wallet.publicKey,
      } as Accounts)
      .rpc();

    const firstNode = await program.account.node.fetch(node1.publicKey);
    const lastNode = await program.account.node.fetch(node3.publicKey);

    assert(firstNode.next.toString() === node3.publicKey.toString(), 'First node should now point to the last node');
    assert(firstNode.data === 42, 'First node should still have data value 42');
    assert(lastNode.data === 84, 'Last node should still have data value 84');
    assert(lastNode.next === null, 'Last node should have null next pointer');
  });

  it('5. Insert After (Complex Scenario)', async () => {
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();
    const node3 = Keypair.generate();
    const node4 = Keypair.generate();

    // Initialize and build a linked list: 10 -> 20 -> 30
    await initializeNode(node1, 10);
    await program.methods
      .append(20)
      .accounts({
        currentNode: node1.publicKey,
        newNode: node2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node2])
      .rpc();
    await program.methods
      .append(30)
      .accounts({
        currentNode: node2.publicKey,
        newNode: node3.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node3])
      .rpc();

    // Insert 25 after 20
    await program.methods
      .insertAfter(25)
      .accounts({
        currentNode: node2.publicKey,
        newNode: node4.publicKey,
        nextNode: node3.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as Accounts)
      .signers([node4])
      .rpc();

    const secondNode = await program.account.node.fetch(node2.publicKey);
    const insertedNode = await program.account.node.fetch(node4.publicKey);
    const lastNode = await program.account.node.fetch(node3.publicKey);

    assert(secondNode.next.toString() === node4.publicKey.toString(), 'Second node should point to the inserted node');
    assert(insertedNode.data === 25, 'Inserted node should have data value 25');
    assert(insertedNode.next.toString() === node3.publicKey.toString(), 'Inserted node should point to the last node');
    assert(lastNode.data === 30, 'Last node should still have data value 30');
    assert(lastNode.next === null, 'Last node should have null next pointer');
  });
});