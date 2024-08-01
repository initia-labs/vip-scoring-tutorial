// assume that example.move is the contract you want to score
// there are three ways to score the contract
// 1. directly update score to specific value
// 2. increase score
// 3. decrease score
// let's see `example_with_scoring.move` how to score each function in `example.move`
module deployer::example {
    use minitia_std::signer;

    fun task_1(_addr: address) {
        //
        // do something
        // 
    }

    fun task_2(_addr: address) {
        //
        // do something
        //
    }

    fun task_3(_addr: address) {
        //
        // do something
        //
    }

    public entry fun awesome_fun_1(account: &signer) {
        task_1(signer::address_of(account));
    }

    public entry fun awesome_fun_2(account: &signer) {
        task_2(signer::address_of(account));
    }

    public entry fun aweseme_fun_3(account: &signer) {
        task_3(signer::address_of(account));
    }
}
