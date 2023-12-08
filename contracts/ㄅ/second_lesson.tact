import "@stdlib/ownable";
import "./extra.fc";

struct DictGetResult {
    key: Address?;
    value: Int;
    flag: Bool;
}

@name(tact_dict_get_min?)
native dictGetMin(dict: map<Address, Int>, key_len: Int): DictGetResult;

fun dictGetMinAddress(dict: map<Address, Int>): DictGetResult {
    return dictGetMin(dict, 267);
}

@name(tact_dict_get_next?)
native dictGetNext(dict: map<Address, Int>, key_len: Int, pivot: Address): DictGetResult;

fun dictGetNextAddress(dict: map<Address, Int>, pivot: Address): DictGetResult {
    return dictGetNext(dict, 267, pivot);
}

message AddContact {
    contact: Address;
}
message RemoveContact {
    contact: Address;
}
message ContactForward {
    contact: Address;
    text: String;
}
message Broadcast {
    text: String;
    value: Int as coins;
}

struct Parameters {
    contactList: map<Address, Int>;
    contactCount: Int as uint8;
    stat: Int as coins;
}

contract SecondLesson with Ownable {
    const sendGas: Int = ton("0.005");
    owner: Address;
    contactList: map<Address, Int>;
    contactCount: Int as uint8;
    stat: Int as coins = 0;

    init(owner: Address, contactList: map<Address, Int>, contactCount: Int) {
        self.owner = owner;
        self.contactList = contactList;
        self.contactCount = contactCount;
    }

    receive() {}

    receive(msg: AddContact) {
        self.requireOwner();
        if (self.contactList.get(msg.contact) == null) {
            self.contactList.set(msg.contact, 0);
            self.contactCount = self.contactCount + 1; 
        }
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingValue
        });
    }
    receive(msg: RemoveContact) {
        self.requireOwner();
        if (self.contactList.get(msg.contact) != null) {
            self.contactList.set(msg.contact, null);
            self.contactCount = self.contactCount - 1; 
        }
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingValue
        });
    }
    receive(msg: ContactForward) {
        self.requireOwner();
        let count: Int? = self.contactList.get(msg.contact);
        require(count != null, "Contact does not exist");
        send(SendParameters{
            to: msg.contact,
            value: 0,
            mode: SendRemainingValue,
            body: msg.text.asComment()
        });
        self.contactList.set(msg.contact, count!! + 1);
        let context: Context = context();
        self.stat = self.stat + context.value;
    }

    receive(msg: Broadcast) {
        self.requireOwner();
        let context: Context = context();
        require(context.value >= (msg.value + self.sendGas) * self.contactCount, "Invalid value");
        let res: DictGetResult = dictGetMinAddress(self.contactList);
        let body: Cell = msg.text.asComment();
        while(res.flag) {
            let temp: Address = res.key!!;
            send(SendParameters{
                to: temp,
                value: msg.value,
                body: body,
                bounce: false
            });
            self.contactList.set(temp, res.value + 1);
            res = dictGetNextAddress(self.contactList, temp);
        }
        self.stat = msg.value * self.contactCount + self.stat;
    }


    get fun params(): Parameters {
        return Parameters{contactList: self.contactList, stat: self.stat, contactCount: self.contactCount};
    }

    get fun contact_stat(contact: Address): Int {
        let count: Int? = self.contactList.get(contact);
        if (count == null) {
            return -1;
        }
        else {
            return count!!;
        }
    }
}