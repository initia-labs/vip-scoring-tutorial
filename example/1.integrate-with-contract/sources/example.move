// Assume that example.move is a contract 
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
