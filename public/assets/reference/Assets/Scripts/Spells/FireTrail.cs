using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class FireTrail : MonoBehaviour
{
    public int DamagesPerTick;
    public float TickRate;
    public float DestroyTime;

    private GameObject _enemy;
    private bool _enemycollide = false;
    
    
    // Start is called before the first frame update
    void Start()
    {
        Destroy(gameObject, DestroyTime);
    }

    private void FixedUpdate()
    {
      
    }


    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.gameObject.tag.Equals("enemy"))
        {
            _enemy = other.gameObject;
            InvokeRepeating("InflictDamage", 0, TickRate);
        }
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        CancelInvoke();
    }

    void InflictDamage()
    {
        _enemy.GetComponent<Health>().LifePoints -= DamagesPerTick;
    }
    
}
